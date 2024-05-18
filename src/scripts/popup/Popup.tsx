import React, { useEffect, useRef, useState } from 'react'
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
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
    const [loadingPrompt, setLoadingPrompt] = useState(null)
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
                setLoadingPrompt(null)
                setLoading(false)
                setCounterarguments([])
                return
            }
            if (inputClaim.length > charLimit) {
                setError(`Please input up to ${charLimit} characters only.`)
                setLoadingPrompt(null)
                setLoading(false)
                setCounterarguments([])
                return
            }

            currentInput.current = inputClaim
            setError(null)
            setLoading(true)
            const safetySettings = [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                }
            ]
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
            const chat = model.startChat({
                generationConfig: {
                    maxOutputTokens: 2048
                },
                safetySettings
            })
            const claim = `${inputClaim}`

            setLoadingPrompt('Assessing the input...')
            const askArgMsg = `Strictly yes or no, is "${claim}" an argument? Please note that an argument is a coherent series of reasons, statements, or facts intended to support or establish a point of view.`
            const askArgMsgResult = await chat.sendMessage(askArgMsg)
            const askArgMsgResponse = askArgMsgResult.response.text()
            console.log('Is an argument? ' + askArgMsgResponse)

            if (askArgMsgResponse.toLowerCase().includes('no')) {
                const askClaimMsg = `Strictly yes or no, is "${claim}" a claim? Please note that a claim is an assertion open to challenge.`
                const askClaimMsgResult = await chat.sendMessage(askClaimMsg)
                const askClaimMsgResponse = askClaimMsgResult.response.text()
                console.log('Is a claim? ' + askClaimMsgResponse)

                if (askClaimMsgResponse.toLowerCase().includes('yes')) {
                    setLoadingPrompt('Identifying the type of claim...')
                    const askCategoryPrompt = `
                    Categorize the sentence "${claim}" into seven categories:
            
                    1. Personal experience (PE): Claims that aren't capable of being checked using publicly-available information, e.g. "I can't save for a deposit."
                    2. Quantity in the past or present (Q): Current value of something e.g. "1 in 4 wait longer than 6 weeks to be seen by a doctor." Changing quantity, e.g. "The Coalition Government has created 1,000 jobs for every day it's been in office." Comparison, e.g. "Free schools are outperforming state schools.". Ranking, e.g. "The UK's the largest importer from the Eurozone."
                    3. Correlation or causation (CC): Correlation e.g. "GCSEs are a better predictor than AS if a student will get a good degree." Causation, e.g. "Tetanus vaccine causes infertility." Absence of a link, e.g. "Grammar schools don't aid social mobility."
                    4. Current laws or rules of operation (CLO): Declarative sentences, which generally have the word "must" or legal terms, e.g. "The UK allows a single adult to care for fewer children than other European countries." Procedures of public institutions, e.g. "Local decisions about commissioning services are now taken by organisations that are led by clinicians." Rules and changes, e.g. "EU residents cannot claim Jobseeker's Allowance if they have been in the country for 6 months and have not been able to find work."
                    5. Prediction (P): Hypothetical claims about the future e.g. "Indeed, the IFS says that school funding will have fallen by 5% in real terms by 2019 as a result of government policies."
                    6. Other type of claim (OTC): Voting records e.g "You voted to leave, didn't you?" Public Opinion e.g "Public satisfaction with the NHS in Wales is lower than it is in England." Support e.g. "The party promised free childcare" Definitions, e.g. "Illegal killing of people is what's known as murder." Any other sentence that you think is a claim.
                    7. Not a claim (NAC): These are sentences that don't fall into any categories and aren't claims. e.g. "What do you think?.", "Questions to the Prime Minister!"
                    
                    Strictly use only one of the 7 labels (PE, Q, CC, CLO, P, OTC, NAC), do not provide any additional explanation.
                    `
                    const askCategoryPromptResult = await chat.sendMessage(askCategoryPrompt)
                    const askCategoryPromptResponse = askCategoryPromptResult.response.text()
                    console.log('Category? ' + askCategoryPromptResponse)

                    if (
                        askCategoryPromptResponse.toLowerCase().includes('pe') ||
                        askCategoryPromptResponse.toLowerCase().includes('nac')
                    ) {
                        setError('The input is not suitable for counterarguments.')
                        setLoadingPrompt(null)
                        setLoading(false)
                        setCounterarguments([])
                        return
                    }
                } else {
                    setError('The input is neither a claim nor an argument.')
                    setLoadingPrompt(null)
                    setLoading(false)
                    setCounterarguments([])
                    return
                }
            }

            setLoadingPrompt('Generating counterarguments...')
            const msgs = [
                `Please provide one argument against "${claim}" strictly with summary (in paragraph form labeled as **Summary:**), body (in paragraph form labeled as **Body:**), and source (in bullet points labeled as **Source:**) as the format. The argument should be well-structured and organized in a coherent manner.
                
                Please make sure that the argument will refute "${claim}" and not support it.`,
                `Please provide another argument against "${claim}" strictly with summary (in paragraph form labeled as **Summary:**), body (in paragraph form labeled as **Body:**), and source (in bullet points labeled as **Source:**) as the format. The argument should be well-structured and organized in a coherent manner.
                
                Please make sure that the argument will refute "${claim}" and not support it.`,
                `Again, please provide another argument against "${claim}" strictly with summary (in paragraph form labeled as **Summary:**), body (in paragraph form labeled as **Body:**), and source (in bullet points labeled as **Source:**) as the format. The argument should be well-structured and organized in a coherent manner.
                
                Please make sure that the argument will refute "${claim}" and not support it.`
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
                setLoadingPrompt(`Generated ${i + 1}/3 counterarguments...`)
            }
            setLoadingPrompt(null)
            setLoading(false)
            setError(null)
            for (let i = 0; i < counterargs.length; i++) {
                const counterarg = counterargs[i]
                const data = await handleRecord(
                    claim.trim(),
                    counterarg.summary,
                    counterarg.body,
                    counterarg.source
                )
                counterargs[i] = data
            }
            setCounterarguments(counterargs)
        } catch (error) {
            setLoadingPrompt(null)
            setLoading(false)
            setCounterarguments([])
            setError('Counterargument generation failed! Please try again.')
            console.log(error.message)
        }
    }

    return (
        <div className="flex w-full h-full">
            <div className="popup-container m-auto p-2 bg-clight w-full h-full rounded">
                {currentUser ? ( // make this true if developing
                    <div className="w-full h-full">
                        <div className="flex gap-1 m-3">
                            <div className="flex-1"></div>
                            <div className="text-cgreen text-left m-auto font-extrabold text-xl">
                                <Link to={homepageRoute} target="_blank" rel="noopener noreferrer">
                                    <span className="hover:cursor-pointer">ArguSure</span>
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
                                    className="h-12 w-12 rounded-full  hover:cursor-pointer"
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
                                className="bg-cbrown text-clight font-semibold w-44 h-12 mt-2 hover:shadow-lg enabled:hover:bg-yellow-900 "
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
                                    <span className="m-0 p-0">Generate Counterarguments</span>
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
                                <div className="w-full mt-16 text-center">
                                    <Spinner className="h-14 fill-cgreen mr-2" />
                                    <span className="text-base text-cgreen font-bold">
                                        {loadingPrompt}
                                    </span>
                                </div>
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
                                    <div className="text-cblack text-base italic p-10 leading-7">
                                        You are browsing the Internet and you read something you
                                        agree with. You think that that is correct, but are you
                                        sure? To maintain an impartial and objective stance, it
                                        might be beneficial for you to think again. After all, you
                                        are probably in a{' '}
                                        <a
                                            className="underline"
                                            href="https://www.google.com/search?q=Filter+Bubble&rlz=1C1KNTJ_enPH1072PH1072&oq=Filter+Bubble&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIGCAEQRRg9MgYIAhBFGD0yBggDEEUYPdIBCDI2NTRqMGoxqAIAsAIA&sourceid=chrome&ie=UTF-8"
                                            target="_blank"
                                        >
                                            Filter Bubble
                                        </a>
                                        . No worries though, <b>ArguSure</b> is here to help!
                                        Powered by Google's multimodal LLM called Gemini, it is a
                                        counterargument generator that lets you conveniently seek
                                        and explore different, contradictory ideas.
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
