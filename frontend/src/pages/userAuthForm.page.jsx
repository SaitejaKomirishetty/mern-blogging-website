import React from 'react';
import InputBox from '../components/input.component';
import googleIcon from '../imgs/google.png';
import { Link } from 'react-router-dom';

const UserAuthForm = ({ type }) => {
    return (
        <section className='h-cover flex items-center justify-center'>
            <form className='w-[80%] max-w-[400px]'>
                <h1 className='text-4xl font-gelasio capitalize text-center mb-24 '>
                    {type == 'sign-in' ? 'Welcome back' : 'Join us Today '}
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

                <button type='submit' className='center btn-dark mt-14 '>
                    {type.replace('-', ' ')}
                </button>

                <div className='relative w-full flex items-center gap-2 my-10 uppercase opacity-10 text-black font-bold'>
                    <hr className='w-1/2 border-black' />
                    <p>or</p>
                    <hr className='w-1/2 border-black' />
                </div>
                <button className='btn-dark flex items-center justify-center gap-4 center'>
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
                        Already a member ?{' '}
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
    );
};

export default UserAuthForm;
