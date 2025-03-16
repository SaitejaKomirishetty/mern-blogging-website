import React, { useContext, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import logo from '../imgs/logo.png';
import AnimationWrapper from '../common/page-animation';
import defaultBanner from '../imgs/blog banner.png';
import { uploadImage } from '../common/aws';
import { Toaster, toast } from 'react-hot-toast';
import { EditorContext } from '../pages/editor.pages';
import EditorJS from '@editorjs/editorjs';
import { tools } from './tools.component';
import axios from 'axios';
import { UserContext } from '../App';

const BlogEditor = () => {
    const navigate = useNavigate();
    let {
        userAuth: { access_token },
    } = useContext(UserContext);
    let {
        blog,
        blog: { title, banner, content, tags, des },
        setBlog,
        setEditorState,
        textEditor,
        setTextEditor,
    } = useContext(EditorContext);

    useEffect(() => {
        if (!textEditor.isReady) {
            setTextEditor(
                new EditorJS({
                    holder: 'textEditor',
                    data: content,
                    tools: tools,
                    placeholder: "Let's write an awesome story",
                })
            );
        }
    }, []);

    const handleBannerUpload = (e) => {
        let img = e.target.files[0];
        if (img) {
            let loadingToast = toast.loading('Uploading...');
            uploadImage(img)
                .then((url) => {
                    if (url) {
                        toast.dismiss(loadingToast);
                        toast.success('Uploaded👍');
                        setBlog({ ...blog, banner: url });
                    }
                })
                .catch((err) => {
                    toast.dismiss(loadingToast);
                    console.log(err);
                    toast.error(err);
                });
        }
        console.log(img);
    };

    const handleTitleKeyDown = (e) => {
        if (e.keyCode === 13) {
            e.preventDefault();
        }
    };

    const handleTitleChange = (e) => {
        const input = e.target;
        console.log(input.scrollHeight);
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
        setBlog({ ...blog, title: input.value });
    };

    const handlePublishEvent = () => {
        //validate form data
        if (banner.length === 0) {
            toast.error('Banner is required');
            return;
        }
        if (title.length === 0) {
            toast.error('Title is required');
            return;
        }
        if (textEditor.isReady) {
            textEditor
                .save()
                .then((outputData) => {
                    if (outputData.blocks.length) {
                        setBlog({ ...blog, content: outputData });
                        setEditorState('publish');
                    } else {
                        return toast.error('Write somthing to publish');
                    }
                })
                .catch((err) => {
                    console.error('EditorJS save error:', err);
                    toast.error('Failed to save content');
                });
        }
    };
    const handleSaveDraft = (e) => {
        // Add your code here to save the draft
        if (e.target.className.includes('disabled')) {
            return;
        }
        if (title.length === 0) {
            return toast.error('Write blog title before saving to draft');
        }

        let loadingToast = toast.loading('Savnig Draft...');
        // Add your code here to publish the blog
        e.target.classList.add('disabled');
        if (textEditor.isReady) {
            textEditor
                .save()
                .then((content) => {
                    let blogObj = {
                        title,
                        banner,
                        des,
                        tags,
                        content,
                        draft: true,
                    };

                    axios
                        .post(
                            import.meta.env.VITE_SERVER_DOMAIN + '/create-blog',
                            blogObj,
                            {
                                headers: {
                                    Authorization: `Bearer ${access_token}`, //the token is a variable which holds the token
                                    'Content-Type': 'application/json',
                                },
                            }
                        )
                        .then((res) => {
                            console.log(res.data);
                            e.target.classList.remove('disabled');
                            toast.dismiss(loadingToast);
                            toast.success('Saved 👍');
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
                })
                .catch((err) => {
                    console.error('EditorJS save error:', err);
                    toast.error('Failed to save content');
                });
        }
    };

    return (
        <>
            <nav className='navbar'>
                <Link to='/' className='flex-none w-10'>
                    <img src={logo} />
                </Link>
                <p className='max-md:hidden text-black line-clamp-1 w-full'>
                    {title.length > 0 ? title : 'New Blog'}
                </p>
                <div className='flex gap-4 ml-auto'>
                    <button
                        className='btn-dark py-2 '
                        onClick={handlePublishEvent}
                    >
                        Publish
                    </button>
                    <button
                        className='btn-light py-2 '
                        onClick={handleSaveDraft}
                    >
                        Save Draft
                    </button>
                </div>
            </nav>
            <Toaster />
            <AnimationWrapper>
                <section>
                    <div className='mx-auto max-w-[900px] w-full'>
                        <div className='relative aspect-video bg-white border-4 border-grey hover:opacity-80'>
                            <label htmlFor='uploadBanner'>
                                <img
                                    src={banner ? banner : defaultBanner}
                                    className='z-20'
                                />
                                {!banner ? (
                                    <input
                                        id='uploadBanner'
                                        type='file'
                                        accept='.png, .jpg, .jpeg'
                                        hidden
                                        onChange={handleBannerUpload}
                                    />
                                ) : null}
                            </label>
                        </div>

                        <textarea
                            defaultValue={title}
                            placeholder='Blog Title'
                            className='text-4xl font-medium w-full h-fit outline-none resize-none mt-10 leading-tight placeholder:opacity-40'
                            onKeyDown={handleTitleKeyDown}
                            onChange={handleTitleChange}
                        ></textarea>
                        <hr className='w-full opacity-10 my-5' />
                        <div id='textEditor' className='font-gelasio'></div>
                    </div>
                </section>
            </AnimationWrapper>
        </>
    );
};

export default BlogEditor;
