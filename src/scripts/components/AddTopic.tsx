import React, { useState } from 'react'
import { Modal, Button, TextInput } from 'flowbite-react'
import { IoIosCheckmarkCircle, IoMdCloseCircle } from 'react-icons/io'
import { useSelector, useDispatch } from 'react-redux'
import { updateSuccess } from '../../redux/user/userSlice'
import { hideAddTopic } from '../../redux/counterargument/counterargSlice'
import { useLocation } from 'react-router-dom'
import type { RootState } from '../../redux/store'

export default function AddTopic() {
    const backendServerRoute = 'http://localhost:5000'
    const currentUser = useSelector((state: RootState) => state.user.currentUser)
    const addTopic = useSelector((state: RootState) => state.counterarg.addTopic)
    const [inputTopic, setInputTopic] = useState('')
    const dispatch = useDispatch()
    const location = useLocation()

    const handleChange = e => {
        setInputTopic(e.target.value)
    }

    const handleAddTopic = async e => {
        e.preventDefault()
        const dataBody = {
            userId: currentUser._id,
            topicName: inputTopic
        }
        try {
            const res = await fetch(backendServerRoute + '/api/saved/addtopic', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataBody)
            })
            const data = await res.json()

            if (!res.ok) {
                console.log(data.message)
            } else {
                dispatch(updateSuccess(data.userWithUpdatedSaved))
                dispatch(hideAddTopic())
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    return location.pathname === '/saved/topics' ? (
        <Modal
            show={addTopic}
            popup
            size="sm"
            className="addtopic-modal"
            onClose={() => dispatch(hideAddTopic())}
        >
            <Modal.Header className="bg-clight">
                <span className="font-bold text-base text-cblack">Add a topic</span>
            </Modal.Header>
            <Modal.Body className="bg-clight">
                <div className="mt-3">
                    <form onSubmit={handleAddTopic}>
                        <TextInput type="text" placeholder="Topic name" onChange={handleChange} />
                        <div className="flex justify-center gap-2 mt-3">
                            <Button
                                type="submit"
                                className="bg-cbrown text-clight font-semibold w-22 h-9 px-2"
                            >
                                Add
                            </Button>
                            <Button
                                className="inner-border-cbrown bg-clight inner-border-solid inner-border-2 w-20 h-9"
                                onClick={() => dispatch(hideAddTopic())}
                            >
                                <span className="text-cbrown font-semibold">Cancel</span>
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal.Body>
        </Modal>
    ) : (
        <form onSubmit={handleAddTopic}>
            <div className={'mt-5 gap-1 ' + (addTopic ? 'flex' : 'hidden')}>
                <TextInput
                    className="flex-1"
                    placeholder="Enter topic name"
                    onChange={handleChange}
                    value={inputTopic}
                />
                <IoIosCheckmarkCircle
                    className="m-auto size-6 text-cgreen hover:cursor-pointer hover:text-clightgreen"
                    onClick={handleAddTopic}
                />
                <IoMdCloseCircle
                    className="m-auto size-6 text-red-400 hover:cursor-pointer hover:text-red-500"
                    onClick={() => {
                        setInputTopic('')
                        dispatch(hideAddTopic())
                    }}
                />
            </div>
        </form>
    )
}
