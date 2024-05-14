import React from 'react'
import { Link } from 'react-router-dom'

export default function PopupLandingPage() {
    const signinRoute = 'http://localhost:5173/sign-in'
    const signupRoute = 'http://localhost:5173/sign-up'

    return (
        <div className="landing-page flex flex-col gap-10 text-center w-full h-full py-16 px-7 overflow-hidden">
            <div className="text-4xl text-cgreen font-extrabold z-10">ArguSure</div>
            <div className="text-cblack text-lg italic z-10 leading-7">
                You are browsing your social media feed and you read something you agree with. You
                think that that is correct, but are you sure? To maintain an impartial and objective
                stance, it might be beneficial for you to think again. After all, you are probably
                in a{' '}
                <a
                    className="underline"
                    href="https://www.google.com/search?q=Filter+Bubble&rlz=1C1KNTJ_enPH1072PH1072&oq=Filter+Bubble&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIGCAEQRRg9MgYIAhBFGD0yBggDEEUYPdIBCDI2NTRqMGoxqAIAsAIA&sourceid=chrome&ie=UTF-8"
                    target="_blank"
                >
                    Filter Bubble
                </a>
                . No worries though, <b>ArguSure</b> is here to help! Powered by Google's multimodal
                LLM called Gemini, it is a counterargument generator that lets you conveniently seek
                and explore different, contradictory ideas.
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
