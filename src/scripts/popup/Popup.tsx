import React, { useEffect, useRef, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Button, Spinner, Textarea } from 'flowbite-react'
import CounterargsContainer from '../components/CounterargsCountainer'
import PopupLandingPage from './PopupLandingPage'
import type { RootState } from '../../redux/store'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { signInSuccess } from '@/redux/user/userSlice'
import Prompt from '../components/Prompt'

const App = () => {
    const backendServerRoute = 'http://localhost:5000'
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const [inputClaim, setInputClaim] = useState('')
    const [counterarguments, setCounterarguments] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const currentInput = useRef('')
    const currentUser = useSelector((state: RootState) => state.user.currentUser)
    const prompt = useSelector((state: RootState) => state.counterarg.prompt)
    const promptText = useSelector((state: RootState) => state.counterarg.promptText)
    const dispatch = useDispatch()
    const charLimit = 500
    const homepageRoute = 'http://localhost:5173/'
    const profilepageRoute = 'http://localhost:5173/profile'

    useEffect(() => {
        const onMount = async () => {
            await getCurrentUser() // get signed in user
        }
        onMount()
    }, [])

    const getCurrentUser = async () => {
        try {
            // remove backendServerRoute if in development mode
            const res = await fetch(backendServerRoute + `/api/user/getuser`, {
                method: 'GET',
                mode: 'cors'
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message)
                dispatch(signInSuccess(null))
            } else {
                setError(null)
                dispatch(signInSuccess(data))
            }
        } catch (error) {
            setError(error.message)
        }
    }

    const handleChange = e => {
        setInputClaim(e.target.value)
    }

    const handleRecord = async (claim, summary, body, source) => {
        const counterargData = { inputClaim: claim, summary, body, source }
        try {
            const res = await fetch(backendServerRoute + '/api/counterarg/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(counterargData)
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message)
            } else {
                setError(null)
                return data
            }
        } catch (error) {
            setError('Something went wrong')
        }
    }

    const generateCounterarguments = async () => {
        try {
            if (!inputClaim) {
                setError('Please input something!')
                setLoading(false)
                setCounterarguments([])
                return
            }
            if (inputClaim.length > charLimit) {
                setError(`Please input up to ${charLimit} characters only.`)
                setLoading(false)
                setCounterarguments([])
                return
            }

            currentInput.current = inputClaim
            setError(null)
            setLoading(true)
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
            const chat = model.startChat({
                generationConfig: {
                    maxOutputTokens: 4096
                }
            })
            const claim = `'${inputClaim}'`

            const askClaimMsg = `Strictly yes or no, is "${claim}" a claim?`
            const askClaimMsgResult = await chat.sendMessage(askClaimMsg)
            const askClaimMsgResponse = askClaimMsgResult.response.text()
            const askArgMsg = `Strictly yes or no, is "${claim}" an argument?`
            const askArgMsgResult = await chat.sendMessage(askArgMsg)
            const askArgMsgResponse = askArgMsgResult.response.text()
            if (
                askClaimMsgResponse.toLowerCase().includes('no') &&
                askArgMsgResponse.toLowerCase().includes('no')
            ) {
                setError('The input is neither a claim nor an argument.')
                setLoading(false)
                setCounterarguments([])
                return
            }

            const msgs = [
                'Provide one argument against ' +
                    claim +
                    ' strictly with summary (in paragraph form labeled as **Summary:**), body (in paragraph form labeled as **Body:**), and source (labeled as **Source:**) as the format',
                'Provide another one with the same format',
                'Provide another one again with the same format'
            ]
            const numOfCounterarguments = 3
            let counterargs = []
            for (let i = 0; i < numOfCounterarguments; i++) {
                const msg = msgs[i]
                const result = await chat.sendMessage(msg)
                const response = await result.response
                const text = response.text()
                console.log(text)
                const summaryPos = text.indexOf('**Summary:**')
                const bodyPos = text.indexOf('**Body:**')
                const sourcePos = text.indexOf('**Source:**')
                const summary = text.substring(summaryPos + 12, bodyPos).trim()
                const body = text.substring(bodyPos + 9, sourcePos).trim()
                const source = text.substring(sourcePos + 11).trim()
                const counterarg = { summary, body, source }
                counterargs.push(counterarg)
            }
            setLoading(false)
            setError(null)
            for (let i = 0; i < counterargs.length; i++) {
                const counterarg = counterargs[i]
                const data = await handleRecord(
                    claim.slice(1, -1),
                    counterarg.summary,
                    counterarg.body,
                    counterarg.source
                )
                counterargs[i] = data
            }
            setCounterarguments(counterargs)
        } catch (error) {
            setLoading(false)
            setCounterarguments([])
            setError('Counterargument generation failed! Please try again.')
            console.log(error.message)
        }
    }

    return (
        <div className="flex w-full h-full">
            <div className="popup-container m-auto p-2 bg-clight w-full h-full rounded cshadow">
                {currentUser ? ( // make this true if developing
                    <div className="w-full h-full">
                        <div className="flex gap-1 m-3">
                            <div className="flex-1"></div>
                            <div className="text-cgreen text-left m-auto font-extrabold text-xl">
                                <Link to={homepageRoute} target="_blank" rel="noopener noreferrer">
                                    <span className="hover:cursor-pointer">Lorem Ipsum</span>
                                </Link>
                            </div>
                            <div className="flex-1"></div>
                        </div>
                        <div className="home-input flex gap-1 justify-center">
                            <Link
                                to={profilepageRoute}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="my-auto w-16"
                            >
                                <img
                                    src={currentUser && currentUser.profilePicture}
                                    className="h-12 rounded-full  hover:cursor-pointer"
                                ></img>
                            </Link>

                            <textarea
                                placeholder="Enter a claim or an argument"
                                className="w-96 max-h-16 min-h-16 rounded"
                                id="inputclaim-area"
                                onChange={handleChange}
                                maxLength={charLimit}
                            />
                            <Button
                                className="bg-cbrown text-clight font-semibold w-44 h-10 mt-2 hover:shadow-lg enabled:hover:bg-yellow-900 "
                                type="button"
                                onClick={generateCounterarguments}
                                disabled={inputClaim && !loading ? false : true}
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="sm" />
                                        <span className="ml-1">Generating...</span>
                                    </>
                                ) : (
                                    'Generate'
                                )}
                            </Button>
                        </div>
                        {error ? (
                            <div className="text-center mt-5 text-base text-red-500">{error}</div>
                        ) : (
                            <></>
                        )}
                        <div>
                            {loading ? (
                                <Spinner className="w-full mt-16 h-14 fill-cgreen" />
                            ) : counterarguments.length !== 0 ? (
                                <>
                                    <div className="flex mt-2">
                                        <div className="flex-1"></div>
                                        <div className="flex gap-3 text-cbrown text-sm justify-center underline mt-1">
                                            <span
                                                className="hover:cursor-pointer hover:text-yellow-800"
                                                onClick={() => generateCounterarguments()}
                                            >
                                                Regenerate
                                            </span>
                                            <Link
                                                to={homepageRoute}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <span className="hover:cursor-pointer hover:text-yellow-800">
                                                    Go to homepage
                                                </span>
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="h-[380px] mt-1 p-2 overflow-y-auto border-2 border-gray-300 rounded">
                                        <div className="w-full text-center text-sm font-bold text-cblack">
                                            Why this might be wrong?
                                        </div>
                                        {counterarguments.map((counterargument, index) => {
                                            return (
                                                <CounterargsContainer
                                                    key={index}
                                                    counterargument={counterargument}
                                                    withClaim={false}
                                                />
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col gap-2 m-auto text-center my-1">
                                    <div className="text-cblack text-base italic p-5">
                                        ..... Lorem ipsum dolor sit amet, consectetur adipiscing
                                        elit. Sed sodales velit vulputate magna euismod, vel maximus
                                        quam aliquam. Nulla eu sem vitae metus fringilla fermentum.
                                        Integer ante tortor, dictum a augue eget, efficitur
                                        tristique tellus. Quisque pretium feugiat blandit. Nam
                                        scelerisque rutrum dolor eget finibus. Vivamus nec nisl
                                        ultrices, auctor ante vitae, lacinia lorem. Aenean
                                        ullamcorper tristique ullamcorper. Vestibulum finibus erat
                                        nibh, nec mollis nisl eleifend non .....
                                    </div>
                                    <div>
                                        <Link
                                            to={homepageRoute}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cbrown text-sm underline w-fit text-center hover:cursor-pointer"
                                        >
                                            Go to homepage
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <PopupLandingPage />
                )}
                {prompt && promptText && <Prompt promptText={promptText} />}
            </div>
        </div>
    )
}

export default App
