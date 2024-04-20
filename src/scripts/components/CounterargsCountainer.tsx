import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { BiDislike, BiLike, BiSolidDislike, BiSolidLike } from 'react-icons/bi'
import { BsThreeDots } from 'react-icons/bs'
import { FiSave, FiFileMinus } from 'react-icons/fi'
import { RiPlayListAddFill } from 'react-icons/ri'
import { Avatar, Dropdown } from 'flowbite-react'
import { updateSuccess } from '../../redux/user/userSlice'
import {
    showSaveToModal,
    setSelectedCounterarg,
    addToSavedCounterargs,
    showUnsaveModal,
    setUnsaveDataBody
} from '../../redux/counterargument/counterargSlice'
import type { RootState } from '../../redux/store'
// import SaveTo from './SaveTo'
import { useParams } from 'react-router-dom'
// import UnsaveModal from './UnsaveModal'

export default function CounterargsContainer({ counterargument, withClaim }) {
    const claim =
        counterargument.inputClaim.charAt(0).toUpperCase() + counterargument.inputClaim.slice(1)
    const summary = counterargument.summary
    const body = counterargument.body
    const source = counterargument.source
    const [readMore, setReadMore] = useState(false)
    const [liked, setLiked] = useState(counterargument.liked)
    // const { currentUser } = useSelector(state => state.user)
    // const { savedCounterargs } = useSelector(state => state.counterarg)
    const currentUser = useSelector((state: RootState) => state.user.currentUser)
    const savedCounterargs = useSelector((state: RootState) => state.counterarg.savedCounterargs)
    const dispatch = useDispatch()
    const { topicSlug } = useParams()

    const handleRead = () => {
        setReadMore(!readMore)
    }

    const handleLike = async action => {
        const dataBody = {
            userId: counterargument.userId,
            _id: counterargument._id,
            liked: action
        }

        try {
            const res = await chrome.runtime.sendMessage({
                command: 'handle-like',
                body: dataBody
            })
            if (res.success === false) {
                console.log(res.data)
            } else {
                setLiked(action)
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    const handleSave = async () => {
        // let savedTo = []
        // if (topicSlug) {
        //     for (let i = 0; i < currentUser.saved.length; i++) {
        //         const topic = currentUser.saved[i]
        //         if (
        //             topic.counterarguments.includes(counterargument._id) ||
        //             topic.slug === topicSlug
        //         ) {
        //             savedTo.push(topic.topicName)
        //         }
        //     }
        // }
        // const dataBody = {
        //     userId: currentUser._id,
        //     counterargId: counterargument._id,
        //     selectedTopics: topicSlug ? savedTo : ['default']
        // }
        // try {
        //     const res = await fetch('/api/saved/save', {
        //         method: 'PUT',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify(dataBody)
        //     })
        //     const data = await res.json()
        //     if (!res.ok) {
        //         console.log(data.message)
        //     } else {
        //         dispatch(addToSavedCounterargs(counterargument._id))
        //         dispatch(updateSuccess(data.userWithUpdatedSaved))
        //     }
        // } catch (error) {
        //     console.log(error.message)
        // }
    }

    const handleUnsave = async () => {
        // let savedTo = []
        // let removeFromTopic = ''
        // for (let i = 0; i < currentUser.saved.length; i++) {
        //     const topic = currentUser.saved[i]
        //     if (topic.counterarguments.includes(counterargument._id)) {
        //         savedTo.push(topic.topicName)
        //     }
        //     if (topic.slug === topicSlug) {
        //         removeFromTopic = topic.topicName
        //     }
        // }
        // const dataBody = {
        //     userId: currentUser._id,
        //     counterargId: counterargument._id,
        //     savedTo: savedTo,
        //     removeFrom: topicSlug ? removeFromTopic : savedTo
        // }
        // dispatch(setUnsaveDataBody(dataBody))
        // dispatch(showUnsaveModal())
    }

    return (
        <div className="flex flex-col w-full mx-auto mb-3 mt-2 cshadow-sm rounded-lg bg-clight text-cblack">
            {withClaim && (
                <div className="font-bold text-xs bg-cgreen px-5 py-3 rounded-t-lg">
                    <u>Input claim</u>: {claim}
                </div>
            )}
            <div className={'flex gap-2 p-2 ' + (readMore ? 'h-full' : 'h-28')}>
                <div className="flex flex-col gap-0 text-justify max-w-[50rem]">
                    <div className="overflow-hidden">
                        <div className="font-semibold text-[0.78rem] italic">{summary}</div>
                        <div className=" mt-2 text-[0.78rem]">
                            <div>{body}</div>
                            <div className="mt-2">
                                <span className="font-semibold">Source:</span>
                                <br />
                                {source}
                            </div>
                        </div>
                    </div>
                    <div
                        className="read-more mx-auto underline text-xs hover:cursor-pointer opacity-80 pt-2 w-full text-center"
                        onClick={handleRead}
                    >
                        {readMore ? 'Read less' : 'Read more'}
                    </div>
                </div>
                <div className="text-cblack">
                    <div className="flex justify-end">
                        <Dropdown
                            className="bg-clight"
                            inline
                            arrowIcon={false}
                            label={
                                <Avatar
                                    alt="meatballs"
                                    img={BsThreeDots}
                                    className="size-2 w-full mt-1 rounded-full hover:bg-gray-300"
                                    size="xs"
                                />
                            }
                        >
                            {Array.isArray(savedCounterargs) &&
                            savedCounterargs.includes(counterargument._id) ? (
                                <Dropdown.Item
                                    icon={FiFileMinus}
                                    className="text-cbrown mr-3"
                                    onClick={handleUnsave}
                                >
                                    <span className="text-cblack font-bold text-xs">Unsave</span>
                                </Dropdown.Item>
                            ) : (
                                <Dropdown.Item
                                    icon={FiSave}
                                    className="text-cbrown mr-3"
                                    onClick={handleSave}
                                >
                                    <span className="text-cblack font-bold text-xs">Save</span>
                                </Dropdown.Item>
                            )}
                            <Dropdown.Item
                                icon={RiPlayListAddFill}
                                className="text-cbrown mr-3"
                                onClick={() => {
                                    dispatch(showSaveToModal())
                                    dispatch(setSelectedCounterarg(counterargument))
                                }}
                            >
                                <span className="text-cblack font-bold text-xs">Save to...</span>
                            </Dropdown.Item>
                        </Dropdown>
                    </div>
                    <div className="flex gap-2 mt-3">
                        {liked !== 'liked' ? (
                            <BiLike
                                className="size-4 hover:cursor-pointer hover:text-cbrown"
                                onClick={() => handleLike('liked')}
                            />
                        ) : (
                            <BiSolidLike
                                className="size-4 text-cbrown hover:cursor-pointer"
                                onClick={() => handleLike('none')}
                            />
                        )}
                        {liked !== 'disliked' ? (
                            <BiDislike
                                className="size-4 hover:cursor-pointer hover:text-cbrown"
                                onClick={() => handleLike('disliked')}
                            />
                        ) : (
                            <BiSolidDislike
                                className="size-4 text-cbrown hover:cursor-pointer"
                                onClick={() => handleLike('none')}
                            />
                        )}
                    </div>
                </div>
            </div>
            {/* <SaveTo />
            <UnsaveModal /> */}
        </div>
    )
}
