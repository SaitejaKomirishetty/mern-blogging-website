// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, SignInMethod, signInWithPopup } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyBmF8YNF6Q47V_DqUFDtbyBNzy8d8sQav4',
    authDomain: 'react-js-blog-website-a6b12.firebaseapp.com',
    projectId: 'react-js-blog-website-a6b12',
    storageBucket: 'react-js-blog-website-a6b12.firebasestorage.app',
    messagingSenderId: '97823522631',
    appId: '1:97823522631:web:4e522a28eb6bc0b6901662',
    measurementId: 'G-25C7PH7K9W',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {
    let user = null;
    await signInWithPopup(auth, provider)
        .then((result) => {
            user = result.user;
        })
        .catch((err) => {
            console.log(err);
        });

    return user;
};
