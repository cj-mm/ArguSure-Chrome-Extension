import React, { useEffect, useRef, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Spinner, TextInput } from 'flowbite-react'
import { IoMdClose } from 'react-icons/io'
import { MdOutlineDriveFileRenameOutline } from 'react-icons/md'
import AppLogo from '../../assets/logo.png'
import BGLogo from '../../assets/bg-logo.png'
import CounterargsContainer from '../components/CounterargsCountainer'
import { signInSuccess } from '../../redux/user/userSlice'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../redux/store'
import { Link } from 'react-router-dom'

const App = () => {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const [counterarguments, setCounterarguments] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [claimEdit, setClaimEdit] = useState('')
    const [top, setTop] = useState(0)
    const [left, setLeft] = useState(0)
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const selectedClaim = useRef('')
    const currentUser = useSelector((state: RootState) => state.user.currentUser)
    const dispatch = useDispatch()
    const homepageRoute = 'http://localhost:5174/'
    const signinRoute = 'http://localhost:5174/sign-in'
    const signupRoute = 'http://localhost:5174/sign-up'

    useEffect(() => {
        chrome.runtime.onMessage.addListener(async (res, sender, sendResponse) => {
            const s = window.getSelection()
            const oRange = s.getRangeAt(0)
            const oRect = oRange.getBoundingClientRect()
            setTop(Math.round(oRect.top))
            setLeft(Math.round(oRect.left))

            const signedInUser = await getCurrentUser() // get signed in user
            if (signedInUser) {
                const data = res.data
                selectedClaim.current = data.selectionText
                setClaimEdit(selectedClaim.current)
                generateCounterarguments()
            }
            setIsOpen(true)
            sendResponse({ msg: 'Response from content script' })
        })
    }, [])

    const handleChange = e => {
        setClaimEdit(e.target.value)
        selectedClaim.current = e.target.value
    }

    const getCurrentUser = async () => {
        try {
            const res = await chrome.runtime.sendMessage({
                command: 'get-user'
            })
            if (res.success === false) {
                setError(res.data)
                dispatch(signInSuccess(null))
                return false
            } else {
                setError(null)
                dispatch(signInSuccess(res.data))
                return true
            }
        } catch (error) {
            setError(error.message)
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

    return (
        isOpen && (
            <div
                className="absolute p-2 bg-clight w-[33rem] h-[33rem] rounded cshadow"
                style={{ top: top, left: left }}
            >
                <div className="flex gap-1">
                    <Link to={homepageRoute} target="_blank" rel="noopener noreferrer">
                        <img src={AppLogo} className="h-10 w-15 hover:cursor-pointer" />
                    </Link>
                    <div className="text-cgreen flex-1 text-left m-auto font-bold text-lg">
                        <Link to={homepageRoute} target="_blank" rel="noopener noreferrer">
                            <span className="hover:cursor-pointer">Lorem Ipsum</span>
                        </Link>
                    </div>
                    <IoMdClose
                        className="text-cblack hover:cursor-pointer"
                        onClick={() => setIsOpen(false)}
                        size={20}
                    />
                </div>
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
                    <div className="flex flex-col gap-10 text-center w-full py-10 px-5 overflow-hidden">
                        <img src={BGLogo} className="absolute top-5 left-0 z-0" />
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
        )
    )
}

export default App
