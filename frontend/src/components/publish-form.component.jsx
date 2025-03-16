import React, { useContext } from 'react';
import AnimationWrapper from '../common/page-animation';
import { Toaster, toast } from 'react-hot-toast';

import { EditorContext } from '../pages/editor.pages';
import Tag from './tags.component';
import axios from 'axios';
import { UserContext } from '../App';
import { useNavigate } from 'react-router-dom';
const charecterLimit = 200;
const tagLimit = 10;

const PublishForm = () => {
    const navigate = useNavigate();
    let {
        blog,
        blog: { banner, title, tags, des, content },
        setEditorState,
        setBlog,
    } = useContext(EditorContext);

    let {
        userAuth: { access_token },
    } = useContext(UserContext);

    const handleCloseEvent = () => {
        setEditorState('editor');
        // Add your code here to close the form
    };

    const handleBlogTitleChange = (e) => {
        setBlog({ ...blog, title: e.target.value });
    };
    const handleBlogDescriptionChange = (e) => {
        setBlog({ ...blog, des: e.target.value });
    };

    const handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            e.preventDefault();
        }
    };
    const handleKeyPress = (e) => {
        if (e.keyCode === 13 || e.keyCode === 188) {
            e.preventDefault();
            let tag = e.target.value;
            if (tags.length == tagLimit) {
                console.log(tag);
                return toast.error('Tags limit reached');
                // return;
            } else if (tags.includes(tag)) {
                return toast.error('Tag already exists');
            } else if (tag && !tags.includes(tag)) {
                setBlog({ ...blog, tags: [...tags, tag] });
                e.target.value = '';
            }
        }
    };

    const publishBlogFunction = (e) => {
        if (e.target.className.includes('disabled')) {
            return;
        }
        if (title.length === 0) {
            return toast.error('Write blog title to publish');
        }
        if (!des || des.length === 0) {
            return toast.error('Write description to publish');
        }
        if (!tags || tags.length === 0) {
            return toast.error('Enter atleast one tag to rank your blog');
        }

        let loadingToast = toast.loading('Publishing...');
        // Add your code here to publish the blog
        e.target.classList.add('disabled');

        let blogObj = {
            title: title,
            banner: banner,
            des: des,
            tags: tags,
            content: content,
            draft: false,
        };

        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + '/create-blog', blogObj, {
                headers: {
                    Authorization: `Bearer ${access_token}`, //the token is a variable which holds the token
                    'Content-Type': 'application/json',
                },
            })
            .then((res) => {
                console.log(res.data);
                e.target.classList.remove('disabled');
                toast.dismiss(loadingToast);
                toast.success('Published 👍');
                setTimeout(() => {
                    navigate('/');
                }, 500);
            })
            .catch(({ response }) => {
                e.target.classList.remove('disabled');
                toast.dismiss(loadingToast);
                console.log(err);
                return toast.error(response.data.error);
            });
    };

    return (
        <AnimationWrapper>
            <section className='w-screen h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4'>
                <Toaster />
                <button
                    className=' h-12 w-12 absolute right-[5vh] top-[5%] z-10 lg:top-[10%]'
                    onClick={handleCloseEvent}
                >
                    <i className='fi fi-br-cross'></i>
                </button>
                <div className='max-w-full w-full center'>
                    <p className='text-dark-grey mb-1'>Preview</p>

                    <div className='w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4'>
                        <img src={banner} />
                    </div>
                    <h1 className='text-4xl font-medium mt-2 leading-tight line-clamp-2 text-ellipsis'>
                        {title}
                    </h1>
                    <p className='font-gelasio line-clamp-2 text-xl leading-7 mt-4'>
                        {des}
                    </p>
                </div>
                <div className='border-grey lg:border-1 lg:pl-8'>
                    <p className='text-dark-grey mb-2 mt-9'>Blog Title</p>
                    <input
                        type='text'
                        placeholder='Blog Title'
                        defaultValue={title}
                        className='input-box pl-4'
                        onChange={handleBlogTitleChange}
                    />
                    <p className='text-dark-grey mb-2 mt-9'>
                        Short Description about your Blog
                    </p>
                    <textarea
                        maxLength={charecterLimit}
                        defaultValue={des}
                        className='h-40 resize-none leading-7 input-box pl-4'
                        onChange={handleBlogDescriptionChange}
                        onKeyDown={handleKeyDown}
                    />
                    <p className='mt-1 text-dark-grey text-sm text-right'>
                        {charecterLimit - parseInt(des?.length)} Charecters left
                    </p>
                    <p className='text-dark-grey mb-2 mt-9'>
                        Topics -(Helps in searching and ranking your blog post)
                    </p>
                    <div className='relative input-box pl-2 py-2 pb-4 space-y-2'>
                        <input
                            type='text'
                            placeholder='Topics'
                            className='sticky input-box bg-white left-0 pl-4 mb-3 focus:bg-white'
                            onKeyDown={handleKeyPress}
                        />
                        {tags.map((tag, index) => (
                            <Tag key={index} tag={tag} tagIndex={index} />
                        ))}
                    </div>
                    <p className='mt-1 mb-4 text-dark-grey text-right'>
                        {tagLimit - tags.length} Tags left
                    </p>
                    <button
                        className='btn-dark px-8 lg:w-full mb-4'
                        onClick={publishBlogFunction}
                    >
                        Publish
                    </button>
                </div>
            </section>
        </AnimationWrapper>
    );
};

export default PublishForm;
