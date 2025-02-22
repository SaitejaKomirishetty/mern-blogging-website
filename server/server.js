import express from 'express';
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
//schema below
import User from './Schema/User.js';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

const server = express();

let PORT = 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());

server.use(cors());

// mongoose.connect(process.env.DB_LOCATION, {
//     autoIndex: true,
// });

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
                return res
                    .status(403)
                    .json({
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
