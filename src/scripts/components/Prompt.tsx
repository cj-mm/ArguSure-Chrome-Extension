import React from 'react'

export default function Prompt({ promptText }) {
    return (
        <div className="popup-prompt relative bottom-20 left-3 w-48 h-12 bg-clightgreen rounded cshadow text-sm font-semibold">
            <div className="flex h-full w-full">
                <span className="m-auto">{promptText}</span>
            </div>
        </div>
    )
}
