import express from 'express';
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import aws from 'aws-sdk';
//schema below
import User from './Schema/User.js';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };
import Blog from './Schema/Blog.js';

const server = express();

let PORT = 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

//setting up s3 bucket

const s3 = new aws.S3({
    region: 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const generateUploadUrl = async () => {
    const date = new Date();
    const imgName = `${nanoid()}-${date.getTime()}.jpeg`;

    return await s3.getSignedUrlPromise('putObject', {
        Bucket: 'blogingwebsite',
        Key: imgName,
        Expires: 1000,
        ContentType: 'image/jpeg',
    });
};

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());

server.use(cors());

// mongoose.connect(process.env.DB_LOCATION, {
//     autoIndex: true,
// });

const verifyJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ error: 'Token is required' });
    }
    const tokenWithoutBearer = token && token.split(' ')[1];

    if (token === null)
        return res.status(401).json({ error: 'No access token provided' });

    jwt.verify(
        tokenWithoutBearer,
        process.env.SECRET_ACCESS_KEY,
        (err, user) => {
            if (err) {
                return res
                    .status(403)
                    .json({ error: 'Access Token is invalid' });
            }
            req.user = user.id;
            next();
        }
    );
};

const formateDataToSend = (user) => {
    const access_token = jwt.sign(
        { id: user._id },
        process.env.SECRET_ACCESS_KEY
    );
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
    };
};

const generateUsername = async (email) => {
    let username = email.split('@')[0];
    let isUsernameNotUnique = await User.exists({
        'personal_info.username': username,
    }).then((result) => result);
    console.log(isUsernameNotUnique);

    username = isUsernameNotUnique
        ? username + nanoid().substring(0, 5)
        : username;
    return username;
};

server.post('/signup', (req, res) => {
    const { email, fullname, password } = req.body;

    //validation
    if (fullname.length < 3) {
        return res
            .status(403)
            .json({ error: 'Fullname must be at least 3 letters long' });
    }
    if (!email.length) {
        return res.status(403).json({ error: 'Enter Email' });
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ error: 'Email is invalid' });
    }
    if (!passwordRegex.test(password)) {
        return res.status(403).json({
            error: 'Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 Uppercase letter',
        });
    }

    bcrypt.hash(password, 10, async (err, hashedPassword) => {
        let username = await generateUsername(email);
        let user = new User({
            personal_info: {
                fullname,
                email,
                password: hashedPassword,
                username,
            },
        });
        user.save()
            .then((u) => {
                return res.status(201).json(formateDataToSend(u));
            })
            .catch((err) => {
                console.log('error:', err);
                if (err.code === 11000) {
                    return res
                        .status(500)
                        .json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            });
    });
});

server.post('/signin', async (req, res) => {
    let { email, password } = req.body;

    const user = User.findOne({ 'personal_info.email': email })
        .then((user) => {
            console.log(user);
            if (!user) {
                return res.status(500).json({ error: 'Email not found' });
            }
            if (user.google_auth) {
                return res.status(403).json({
                    error: 'account was created using google try log in with google ',
                });
            }
            bcrypt.compare(
                password,
                user.personal_info.password,
                (err, result) => {
                    if (err) {
                        return res.status(403).json({
                            error: 'Error occurred while log in please try again',
                        });
                    }
                    if (!result) {
                        return res
                            .status(403)
                            .json({ error: 'Incorrect password' });
                    } else {
                        return res.status(200).json(formateDataToSend(user));
                    }
                }
            );
            // return res.status(200).json({ status: 'got user document' });
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        });
});

server.post('/google-auth', async (req, res) => {
    let { access_token } = req.body;
    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodedUser) => {
            console.log(decodedUser);
            let { email, name, picture } = decodedUser;
            picture = picture.replace('s96-c', 's384-c');

            let user = await User.findOne({
                'personal_info.email': email,
            })
                .select(
                    'personal_info.fullname personal_info.username personal_info.profile_img google_auth'
                )
                .then((u) => {
                    return u || null;
                })
                .catch((err) => {
                    return res.status(500).json({ error: err.message });
                });
            if (user) {
                //login
                if (!user.google_auth) {
                    return res.status(403).json({
                        error: 'THis email was signed up without google. Please login with password to access the account',
                    });
                }
            } else {
                //signup
                console.log(user);
                let username = await generateUsername(email);
                user = new User({
                    personal_info: {
                        fullname: name,
                        email,
                        username,
                    },
                    google_auth: true,
                });
                await user
                    .save()
                    .then((u) => {
                        user = u;
                    })
                    .catch((err) =>
                        res.status(500).json({ error: err.message })
                    );
                return res.status(200).json(formateDataToSend(user));
            }
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).json({
                error: 'Failed to authenticate with google. Try with some other google account',
            });
        });
});

//uplode image url

server.get('/get-upload-url', (req, res) => {
    generateUploadUrl()
        .then((url) => res.status(200).json({ uploadUrl: url }))
        .catch((err) => {
            console.log(err);
            return res.status(500).json({ error: err });
        });
});

server.post('/create-blog', verifyJWT, async (req, res) => {
    let { title, content, banner, des, tags, draft } = req.body;
    if (!title.length) {
        return res
            .status(403)
            .json({ error: 'You must provide title to publish the blog' });
    }
    if (!draft) {
        if (!des.length || des.length > 200) {
            return res
                .status(403)
                .json({
                    error: 'Description must be between 1 to 100 characters',
                });
        }

        if (!banner.length) {
            return res
                .status(403)
                .json({ error: 'You must provide blog Banner' });
        }

        if (!content.blocks.length) {
            return res
                .status(403)
                .json({ error: 'You must provide blog content' });
        }

        if (!tags.length) {
            return res
                .status(403)
                .json({ error: 'You must provide blog tags' });
        }
    }

    const userId = req.user;

    let user = await User.findById(userId).then((u) => u);

    if (!user) {
        return res.status(403).json({ error: 'User not found' });
    }

    tags = tags.map((tag) => tag.toLowerCase());

    let blog_id =
        title
            .replace(/[^a-zA-Z0-9]/g, ' ')
            .replace(/\s+/g, '-')
            .trim() + nanoid();

    let blog = new Blog({
        blog_id,
        title,
        banner,
        des,
        content,
        tags,
        author: userId,
        draft: Boolean(draft),
    });

    blog.save()
        .then((blog) => {
            let increment = draft ? 0 : 1;
            User.findOneAndUpdate(
                { _id: userId },
                {
                    $inc: {
                        'account_info.total_posts': increment,
                    },
                    $push: {
                        blogs: blog._id,
                    },
                }
            )
                .then((user) => {
                    if (!user)
                        return res
                            .status(500)
                            .json({ error: 'Failed to create blog' });

                    return res.status(201).json({
                        id: blog.blog_id,
                        status: 'Blog created successfully',
                    });
                })
                .catch((err) => {
                    console.log(err);
                    return res.status(500).json({
                        error: 'Faild to update total postes number ',
                    });
                });
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).json({ error: err.message });
        });

    // return res.status(200).json({ status: blogId });
});

async function startServer() {
    try {
        await mongoose.connect(process.env.DB_LOCATION, {
            autoIndex: true,
        });
        console.log('Connected to MongoDB');

        server.listen(PORT, () => {
            console.log('Listening on the port : ', PORT);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

startServer();
