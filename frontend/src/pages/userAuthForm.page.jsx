import React, { useContext, useRef } from 'react';
import InputBox from '../components/input.component';
import googleIcon from '../imgs/google.png';
import { Link, Navigate } from 'react-router-dom';
import AnimationWrapper from '../common/page-animation';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import { storeInSession } from '../common/session';
import { UserContext } from '../App';
import { authWithGoogle } from '../common/firebase';

const UserAuthForm = ({ type }) => {
    let {
        userAuth: { access_token },
        setUserAuth,
    } = useContext(UserContext);

    console.log(access_token);

    const handleGoogleAuth = (e) => {
        e.preventDefault();
        authWithGoogle()
            .then((user) => {
                let serverRoute = '/google-auth';
                let formData = {
                    access_token: user.accessToken,
                };
                userAuthThroughServer(serverRoute, formData);
            })
            .catch((err) => {
                toast.error('trouble signing in');
            });
    };

    const userAuthThroughServer = (serverRoute, formData) => {
        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
            .then(({ data }) => {
                storeInSession('user', JSON.stringify(data));
                setUserAuth(data);
                console.log(data);
            })
            .catch(({ response }) => {
                toast.error(response.data.error);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let serverRoute = type === 'sign-in' ? '/signin' : '/signup';

        //form data
        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

        let form = new FormData(formElement);
        let formData = {};
        for (let [key, value] of form.entries()) {
            formData[key] = value;
        }

        let { email, fullname, password } = formData;
        if (fullname) {
            if (fullname.length < 3) {
                return toast.error('Fullname must be at least 3 letters long');
            }
        }
        if (!email.length) {
            return toast.error('Enter Email');
        }
        if (!emailRegex.test(email)) {
            return toast.error('Email is invalid');
        }
        if (!passwordRegex.test(password)) {
            return toast.error(
                'Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 Uppercase letter'
            );
        }

        userAuthThroughServer(serverRoute, formData);
    };
    return (
        <>
            {access_token ? (
                <Navigate to='/' />
            ) : (
                <AnimationWrapper keyValue={type}>
                    <section className='h-cover flex items-center justify-center'>
                        <Toaster />
                        <form
                            id='formElement'
                            className='w-[80%] max-w-[400px]'
                        >
                            <h1 className='text-4xl font-gelasio capitalize text-center mb-24 '>
                                {type == 'sign-in'
                                    ? 'Welcome back'
                                    : 'Join us Today '}
                            </h1>
                            {type !== 'sign-in' ? (
                                <InputBox
                                    type='text'
                                    name='fullname'
                                    placeholder='Full Name'
                                    icon='fi-rs-user'
                                />
                            ) : null}
                            <InputBox
                                type='email'
                                name='email'
                                placeholder='Email'
                                icon='fi-rr-envelope'
                            />
                            <InputBox
                                type='password'
                                name='password'
                                placeholder='Password'
                                icon='fi-rr-key'
                            />

                            <button
                                type='submit'
                                onClick={handleSubmit}
                                className='center btn-dark mt-14 '
                            >
                                {type.replace('-', ' ')}
                            </button>

                            <div className='relative w-full flex items-center gap-2 my-10 uppercase opacity-10 text-black font-bold'>
                                <hr className='w-1/2 border-black' />
                                <p>or</p>
                                <hr className='w-1/2 border-black' />
                            </div>
                            <button
                                className='btn-dark flex items-center justify-center gap-4 center'
                                onClick={handleGoogleAuth}
                            >
                                <img src={googleIcon} className='w-5 h-5 ' />
                                Continue with google
                            </button>

                            {type === 'sign-in' ? (
                                <p className='text-dark-grey mt-6 text-xl text-center'>
                                    Don't have an account ?{' '}
                                    <Link
                                        to='/signup'
                                        className='underline text-black text-xl ml-1'
                                    >
                                        Join us Today
                                    </Link>
                                </p>
                            ) : (
                                <p className='text-dark-grey mt-6 text-xl text-center'>
                                    Already a member ?
                                    <Link
                                        to='/signin'
                                        className='underline text-black text-xl ml-1'
                                    >
                                        Sign in here
                                    </Link>
                                </p>
                            )}
                        </form>
                    </section>
                </AnimationWrapper>
            )}
        </>
    );
};

export default UserAuthForm;
