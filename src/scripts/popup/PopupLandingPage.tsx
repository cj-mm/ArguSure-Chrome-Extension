import React from 'react'
import { Link } from 'react-router-dom'

export default function PopupLandingPage() {
    const signinRoute = 'http://localhost:5173/sign-in'
    const signupRoute = 'http://localhost:5173/sign-up'

    return (
        <div className="landing-page flex flex-col gap-10 text-center w-full h-full py-16 px-7 overflow-hidden">
            <div className="text-4xl text-cgreen font-extrabold z-10">Lorem Ipsum Dolor</div>
            <div className="text-cblack text-lg italic z-10">
                ..... Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sodales velit
                vulputate magna euismod, vel maximus quam aliquam. Nulla eu sem vitae metus
                fringilla fermentum. Integer ante tortor, dictum a augue eget, efficitur tristique
                tellus. Quisque pretium feugiat blandit. Nam scelerisque rutrum dolor eget finibus.
                Vivamus nec nisl ultrices, auctor ante vitae, lacinia lorem. Aenean ullamcorper
                tristique ullamcorper. Vestibulum finibus erat nibh, nec mollis nisl eleifend non
                .....
            </div>
            <div className="gap-3 z-10 text-lg w-full justify-center text-cblack font-bold">
                Need to{' '}
                <Link to={signinRoute} target="_blank" rel="noopener noreferrer">
                    <span className="text-cbrown underline hover:cursor-pointer">Sign in</span>
                </Link>{' '}
                or{' '}
                <Link to={signupRoute} target="_blank" rel="noopener noreferrer">
                    <span className="text-cbrown underline hover:cursor-pointer">Sign up</span>
                </Link>{' '}
                first
            </div>
        </div>
    )
}
