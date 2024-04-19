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

chrome.action.setBadgeText({ text: 'ON' })

// chrome.action.onClicked.addListener(() => {
//     chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
//         const activeTab = tabs[0]
//         chrome.tabs.sendMessage(activeTab.id!, { message: 'clicked_browser_action' })
//     })
// })

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
                sendResponse({ success: true, data: recorded })
            }
            record()
            return true
        default:
            break
    }
})

chrome.commands.onCommand.addListener(command => {
    console.log(`Command: ${command}`)

    if (command === 'refresh_extension') {
        chrome.runtime.reload()
    }
})

const handleRecord = async (claim, summary, body, source) => {
    const counterargData = { inputClaim: claim, summary, body, source }
    try {
        const res = await fetch('http://localhost:5000/api/counterarg/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(counterargData),
            mode: 'cors'
        })
        const data = await res.json()
        if (!res.ok) {
            console.log(data.message)
        } else {
            return data
        }
    } catch (error) {
        console.log(error.message)
    }
}

export {}
