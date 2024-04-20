import { handleRecord, fetchUser, fetchHandleLike } from './api-req-handler'

console.log('Background Service Worker Loaded')
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed')
    chrome.contextMenus.create({
        id: 'generate-counterarguments',
        title: 'Generate counterarguments for "%s"',
        type: 'normal',
        contexts: ['selection']
    })
})

chrome.contextMenus.onClicked.addListener(info => {
    // chrome.runtime.sendMessage({ command: 'hello-world' })
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        let activeTab = tabs[0]
        console.log(activeTab)
        chrome.tabs.sendMessage(activeTab.id, { data: info }, res => {
            console.log(res)
        })
    })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { command, body } = message
    switch (command) {
        case 'hello-world':
            console.log('Hello World, from the Background Service Worker')
            sendResponse({ success: true, message: 'Hello World' })
            break
        case 'record-counterargs':
            const record = async () => {
                const recorded = await handleRecord(
                    body.inputClaim,
                    body.summary,
                    body.body,
                    body.source
                )
                if (recorded) {
                    sendResponse({ success: true, data: recorded })
                } else {
                    sendResponse({ success: false, data: 'Failed request' })
                }
            }
            record()
            return true
        case 'get-user':
            const getUser = async () => {
                const user = await fetchUser()
                if (user) {
                    sendResponse({ success: true, data: user })
                } else {
                    sendResponse({ success: false, data: 'Failed request' })
                }
            }
            getUser()
            return true
        case 'handle-like':
            const handleLike = async () => {
                const likeRes = await fetchHandleLike(body)
                if (likeRes) {
                    sendResponse({ success: true, data: likeRes })
                } else {
                    sendResponse({ success: false, data: 'Failed request' })
                }
            }
            handleLike()
            return true
        default:
            console.log('default')
            break
    }
})

chrome.commands.onCommand.addListener(command => {
    console.log(`Command: ${command}`)

    if (command === 'refresh_extension') {
        chrome.runtime.reload()
    }
})

// chrome.action.setBadgeText({ text: 'ON' })

// chrome.action.onClicked.addListener(() => {
//     chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
//         const activeTab = tabs[0]
//         chrome.tabs.sendMessage(activeTab.id!, { message: 'clicked_browser_action' })
//     })
// })

export {}
