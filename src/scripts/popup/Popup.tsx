import React, { useEffect, useRef, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Spinner, TextInput } from 'flowbite-react'
import { MdOutlineDriveFileRenameOutline } from 'react-icons/md'
import AppLogo from '../../assets/logo.png'
import BGLogo from '../../assets/bg-logo.png'
import CounterargsContainer from '../components/CounterargsCountainer'
import { signInSuccess } from '../../redux/user/userSlice'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../redux/store'
import { Link } from 'react-router-dom'
import PopupLandingPage from './PopupLandingPage'

const App = () => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const [counterarguments, setCounterarguments] = useState([])
    const [claimEdit, setClaimEdit] = useState('')
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const selectedClaim = useRef('')
    const currentUser = useSelector((state: RootState) => state.user.currentUser)
    const dispatch = useDispatch()
    const homepageRoute = 'http://localhost:5173/'
    const signinRoute = 'http://localhost:5173/sign-in'
    const signupRoute = 'http://localhost:5173/sign-up'

    useEffect(() => {
        const onMount = async () => {
            await getCurrentUser() // get signed in user
            if (currentUser) {
                setClaimEdit(selectedClaim.current)
                // generateCounterarguments()
            }
        }
        onMount()
    }, [])

    const handleChange = e => {
        setClaimEdit(e.target.value)
        selectedClaim.current = e.target.value
    }

    const getCurrentUser = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/user/getuser`, {
                method: 'GET',
                mode: 'cors'
            })
            const data = await res.json()
            console.log('WAHAHAHAHHA HAHAH')
            console.log(data)
            if (!res.ok) {
                console.log('WAHAHAHAHHA FAILED')
                console.log(data.message)
                dispatch(signInSuccess(null))
                // return false
            } else {
                console.log('WAHAHAHAHHA SUCCESS')
                console.log(data)
                setError(null)
                dispatch(signInSuccess(data))
                // return data
            }
        } catch (error) {
            console.log(error.message)
            return false
        }
    }

    const handleRecord = async (claim, summary, body, source) => {
        const counterargData = { inputClaim: claim, summary, body, source }
        try {
            const res = await chrome.runtime.sendMessage({
                command: 'record-counterargs',
                body: counterargData
            })
            if (res.success === false) {
                setError(res.data)
            } else {
                setError(null)
                return res.data
            }
        } catch (error) {
            setError(error.message)
        }
    }

    const generateCounterarguments = async () => {
        try {
            ////
            selectedClaim.current = 'self driving cars'
            ////
            if (!selectedClaim.current) {
                setError('Please select something!')
                setLoading(false)
                setCounterarguments([])
                return
            }
            // currentInput.current = inputClaim
            setError(null)
            setLoading(true)
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

            const chat = model.startChat({
                // history: [
                //   {
                //     role: "user",
                //     parts: "Hello!",
                //   },
                //   {
                //     role: "model",
                //     parts: "Great to meet you. What would you like to know?",
                //   },
                // ],
                generationConfig: {
                    maxOutputTokens: 4096
                }
            })

            const claim = `'${selectedClaim.current}'`
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
            setLoading(false)
            setError(null)
        } catch (error) {
            setLoading(false)
            setCounterarguments([])
            setError('Counterargument generation failed! Please try again.')
            console.log(error.message)
        }
    }

    // const getCookie = () => {
    //     const value = `; ${document.cookie}`
    //     const parts = value.split(`; access_token=`)
    //     if (parts.length === 2) return parts.pop().split(';').shift()
    // }

    return (
        <div className="flex w-full h-full">
            <div className="m-auto p-2 bg-clight w-full h-full rounded cshadow">
                {currentUser ? (
                    <div>
                        <div>
                            <div className="flex gap-2">
                                <div className="flex-1 h-12 w-2/3 p-1 mt-2 bg-clightgreen rounded shadow-lg">
                                    <div className="flex gap-1 h-full">
                                        {editing ? (
                                            <form
                                                className="flex-1 mt-1"
                                                onSubmit={e => {
                                                    e.preventDefault()
                                                    setEditing(false)
                                                    generateCounterarguments()
                                                }}
                                            >
                                                <TextInput
                                                    type="text"
                                                    placeholder="Enter to edit"
                                                    onChange={handleChange}
                                                    value={claimEdit}
                                                    sizing="sm"
                                                />
                                            </form>
                                        ) : (
                                            <div className="flex flex-1 h-full text-cblack text-sm font-semibold items-center">
                                                <span className="line-clamp-2">
                                                    <span className="underline">Input</span>: "
                                                    {selectedClaim.current}"
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {loading ? (
                                    <span className="text-cbrown m-auto hover:cursor-not-allowed">
                                        <MdOutlineDriveFileRenameOutline size={20} />
                                    </span>
                                ) : (
                                    <span
                                        className="text-cbrown m-auto hover:cursor-pointer hover:text-yellow-800"
                                        onClick={() => setEditing(!editing)}
                                    >
                                        <MdOutlineDriveFileRenameOutline size={20} />
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex mx-2">
                            <div className="flex-1 text-sm font-bold text-cblack mt-1">
                                Why this might be wrong?
                            </div>
                            <div className="flex gap-3 text-cbrown text-xs justify-center underline mt-1">
                                {loading ? (
                                    <span className="hover:cursor-not-allowed">Regenerate</span>
                                ) : (
                                    <span
                                        className="hover:cursor-pointer hover:text-yellow-800"
                                        onClick={() => generateCounterarguments()}
                                    >
                                        Regenerate
                                    </span>
                                )}
                                <Link to={homepageRoute} target="_blank" rel="noopener noreferrer">
                                    <span className="hover:cursor-pointer hover:text-yellow-800">
                                        Go to homepage
                                    </span>
                                </Link>
                            </div>
                        </div>
                        <div className="h-[24rem] w-full overflow-auto p-1 border-2 border-gray-200">
                            {error ? (
                                <div className="text-center mt-5 text-red-500">{error}</div>
                            ) : (
                                <></>
                            )}
                            <div className="text-cblack">
                                {loading ? (
                                    <Spinner className="w-full m-auto mt-24 h-14 fill-cgreen" />
                                ) : counterarguments.length !== 0 ? (
                                    <div>
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
                                ) : (
                                    !error && (
                                        <div className="text-center">
                                            No Counterarguments Generated
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <PopupLandingPage />
                )}
            </div>
        </div>
    )
}

export default App
