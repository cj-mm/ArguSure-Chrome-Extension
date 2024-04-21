import React, { useEffect, useRef, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Spinner, TextInput } from 'flowbite-react'
import { MdOutlineDriveFileRenameOutline } from 'react-icons/md'
import AppLogo from '../../assets/logo.png'
import CounterargsContainer from '../components/CounterargsCountainer'
import { signInSuccess } from '../../redux/user/userSlice'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../redux/store'
import { Link, useLocation } from 'react-router-dom'

const WindowPopup = () => {
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
    const location = useLocation()
    const homepageRoute = 'http://localhost:5174/'
    const signinRoute = 'http://localhost:5174/sign-in'
    const signupRoute = 'http://localhost:5174/sign-up'
    const backendServerRoute = 'http://localhost:5000'

    useEffect(() => {
        const onMount = async () => {
            await getCurrentUser() // get signed in user
            if (currentUser) {
                selectedClaim.current = new URLSearchParams(location.search).get('selectedText')
                setClaimEdit(selectedClaim.current)
                generateCounterarguments()
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
            const res = await fetch(
                `${backendServerRoute}/api/user/getuser?cookie=${getCookie()}`,
                {
                    method: 'GET',
                    mode: 'cors'
                }
            )
            const data = await res.json()
            if (!res.ok) {
                setError(data.message)
                dispatch(signInSuccess(null))
            } else {
                console.log(data)
                setError(null)
                dispatch(signInSuccess(data))
            }
        } catch (error) {
            setError(error.message)
        }
    }

    const handleRecord = async (claim, summary, body, source) => {
        const counterargData = { inputClaim: claim, summary, body, source }
        try {
            const res = await fetch(
                `${backendServerRoute}/api/counterarg/record?cookie=${getCookie()}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(counterargData)
                }
            )
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
            if (!selectedClaim.current) {
                setError('Please select something!')
                setLoading(false)
                setCounterarguments([])
                return
            }
            setError(null)
            setLoading(true)
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

            const chat = model.startChat({
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

    const getCookie = () => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; access_token=`)
        if (parts.length === 2) return parts.pop().split(';').shift()
    }

    return (
        <div className="flex w-screen h-screen">
            <div className="m-auto p-2 bg-clight w-[600px] h-[580px] rounded cshadow">
                {currentUser ? (
                    <>
                        <div className="flex gap-1">
                            <Link to={homepageRoute} target="_blank" rel="noopener noreferrer">
                                <img src={AppLogo} className="h-10 w-15 hover:cursor-pointer" />
                            </Link>
                            <div className="flex-1 text-cgreen text-left m-auto font-bold text-lg">
                                <Link to={homepageRoute} target="_blank" rel="noopener noreferrer">
                                    <span className="hover:cursor-pointer">Lorem Ipsum</span>
                                </Link>
                            </div>
                        </div>
                        <div>
                            <div className="flex gap-2">
                                <div className="flex items-center justify-center mt-2 ml-2 text-cblack text-sm font-bold">
                                    Input:
                                </div>
                                <div className="flex-1 h-14 w-2/3 p-1 mt-2 bg-clightgreen rounded shadow-lg">
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
                                                />
                                            </form>
                                        ) : (
                                            <div className="flex flex-1 h-full pl-2 text-cblack text-sm font-semibold items-center">
                                                <span className="line-clamp-2">
                                                    {selectedClaim.current}
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
                        <div className="flex m-2">
                            <div className="flex-1"></div>
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
                        <div className="h-[26.5rem] w-full overflow-auto mt-2 p-1 border-2 border-gray-200">
                            <div className="flex-1 text-sm text-center font-bold text-cblack mt-1">
                                Why this might be wrong?
                            </div>
                            {error ? (
                                <div className="text-center mt-5 text-red-500">{error}</div>
                            ) : (
                                <></>
                            )}
                            <div className="text-cblack">
                                {loading ? (
                                    <Spinner className="w-full mt-16 h-14 fill-cgreen" />
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
                                        <div className="text-center mt-5">
                                            No Counterarguments Generated
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="landing-page flex flex-col gap-10 text-center w-full h-full py-16 px-5 overflow-hidden">
                        <div className="text-4xl text-cgreen font-extrabold z-10">
                            Lorem Ipsum Dolor
                        </div>
                        <div className="text-cblack italic z-10">
                            ..... Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                            sodales velit vulputate magna euismod, vel maximus quam aliquam. Nulla
                            eu sem vitae metus fringilla fermentum. Integer ante tortor, dictum a
                            augue eget, efficitur tristique tellus. Quisque pretium feugiat blandit.
                            Nam scelerisque rutrum dolor eget finibus. Vivamus nec nisl ultrices,
                            auctor ante vitae, lacinia lorem. Aenean ullamcorper tristique
                            ullamcorper. Vestibulum finibus erat nibh, nec mollis nisl eleifend non
                            .....
                        </div>
                        <div className="gap-3 z-10  w-full justify-center text-cblack font-bold">
                            Need to{' '}
                            <Link to={signinRoute} target="_blank" rel="noopener noreferrer">
                                <span className="text-cbrown underline hover:cursor-pointer">
                                    Sign in
                                </span>
                            </Link>{' '}
                            or{' '}
                            <Link to={signupRoute} target="_blank" rel="noopener noreferrer">
                                <span className="text-cbrown underline hover:cursor-pointer">
                                    Sign up
                                </span>
                            </Link>{' '}
                            first
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default WindowPopup
