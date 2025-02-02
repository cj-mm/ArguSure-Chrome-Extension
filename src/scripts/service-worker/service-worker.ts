console.log('Background Service Worker Loaded')
const windowPopupRoute = 'https://argusure.onrender.com/window-popup?selectedText='

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
    chrome.tabs.create(
        {
            url: windowPopupRoute + info.selectionText,
            active: false
        },
        tab => {
            chrome.windows.create({
                tabId: tab.id,
                type: 'popup',
                focused: true,
                width: 610,
                height: 620
            })
        }
    )
})

chrome.action.setBadgeText({ text: 'ON' })

chrome.action.onClicked.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const activeTab = tabs[0]
        chrome.tabs.sendMessage(activeTab.id!, { message: 'clicked_browser_action' })
    })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { command } = message
    switch (command) {
        case 'hello-world':
            console.log('Hello World, from the Background Service Worker')
            sendResponse({ success: true, message: 'Hello World' })
            break
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

export {}
