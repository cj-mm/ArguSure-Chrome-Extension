import React, { useEffect, useRef, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Button, Spinner, TextInput, Textarea } from 'flowbite-react'
import { IoMdClose } from 'react-icons/io'
import { MdOutlineDriveFileRenameOutline } from 'react-icons/md'
import AppLogo from '../../assets/logo.png'
import SkeletonLoader from '../components/SkeletonLoader'
// import ContentCounterargContainer from '../components/ContentCounterargContainer'

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

    useEffect(() => {
        chrome.runtime.onMessage.addListener((res, sender, sendResponse) => {
            const s = window.getSelection()
            const oRange = s.getRangeAt(0)
            const oRect = oRange.getBoundingClientRect()
            setTop(Math.round(oRect.top))
            setLeft(Math.round(oRect.left))

            const data = res.data
            selectedClaim.current = data.selectionText
            setClaimEdit(selectedClaim.current)
            setIsOpen(true)
            generateCounterarguments()

            sendResponse({ msg: 'Response from content script' })
            return true
        })
    }, [])

    const handleChange = e => {
        setClaimEdit(e.target.value)
        selectedClaim.current = claimEdit
    }

    const handleRecord = async (claim, summary, body, source) => {
        const counterargData = { inputClaim: claim, summary, body, source }
        try {
            const res = await chrome.runtime.sendMessage({
                command: 'record-counterargs',
                body: counterargData
            })
            if (!res.success) {
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

            // for (let i = 0; i < counterargs.length; i++) {
            //     const counterarg = counterargs[i]
            //     const data = await handleRecord(
            //         claim.slice(1, -1),
            //         counterarg.summary,
            //         counterarg.body,
            //         counterarg.source
            //     )
            //     counterargs[i] = data
            // }
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
            <>
                <div
                    className="absolute p-2 bg-clight w-[33rem] h-[33rem] rounded cshadow"
                    style={{ top: top, left: left }}
                >
                    <div className="flex gap-1">
                        <img src={AppLogo} className="h-10 w-15 hover:cursor-pointer" />
                        <div className="text-cgreen flex-1 text-left m-auto font-bold text-lg">
                            <span className="hover:cursor-pointer">Lorem Ipsum</span>
                        </div>
                        <IoMdClose
                            className="text-cblack hover:cursor-pointer"
                            onClick={() => setIsOpen(false)}
                            size={20}
                        />
                    </div>
                    <div>
                        <div className="flex gap-2">
                            <div className="flex-1 h-12 w-2/3 p-1 mt-2 bg-clightgreen rounded shadow-lg">
                                <div className="flex gap-1 h-full">
                                    {editing ? (
                                        <form className="flex-1 mt-1">
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
                            <span
                                className="text-cbrown m-auto hover:cursor-pointer hover:text-yellow-800"
                                onClick={() => setEditing(!editing)}
                            >
                                <MdOutlineDriveFileRenameOutline size={20} />
                            </span>
                        </div>
                    </div>
                    <div className="flex mx-2">
                        <div className="flex-1 text-sm font-bold text-cblack mt-1">
                            Why this might be wrong?
                        </div>
                        <div className="flex gap-3 text-cbrown text-xs justify-center underline mt-1">
                            <span className="hover:cursor-pointer hover:text-yellow-800">
                                Regenerate
                            </span>
                            <span className="hover:cursor-pointer hover:text-yellow-800">
                                Go to homepage
                            </span>
                        </div>
                    </div>
                    <div className="h-[23.5rem] w-full overflow-auto border-2 border-gray-200 rounded p-1 mt-1">
                        {error ? (
                            <div className="text-center mt-5 text-red-500">{error}</div>
                        ) : (
                            <></>
                        )}
                        <div className="text-cblack">
                            {loading ? (
                                <Spinner className="w-full m-auto mt-2 h-14 fill-cgreen" />
                            ) : counterarguments.length !== 0 ? (
                                <div>
                                    {counterarguments.map((counterargument, index) => {
                                        return (
                                            // <ContentCounterargContainer
                                            //     key={index}
                                            //     counterargument={counterargument}
                                            //     withClaim={false}
                                            // />
                                            counterargument.summary
                                        )
                                    })}
                                </div>
                            ) : (
                                <div>No Counterarguments Generated</div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        )
    )
}

export default App
