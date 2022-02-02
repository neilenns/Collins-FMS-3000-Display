import './App.css';
import React, { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { McduScreen } from './McduScreen.jsx';
import { WebsocketContext } from './WebsocketContext.jsx';

function App() {
    const [fullscreen, setFullscreen] = useState(window.location.href.endsWith('fullscreen'));
    const socketUrl = `ws://localhost:8086`;

    const [content, setContent] = useState(
        {
            lines: [
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
            ],
            scratchpad: '',
            message: '',
            title: '',
            titleLeft: '',
            page: '',
            exec: false,
            power: false,
        },
    );

    const {
        sendMessage,
        lastMessage,
        readyState,
    } = useWebSocket(socketUrl, {
        shouldReconnect: () => true,
        reconnectAttempts: Infinity,
        reconnectInterval: 500,
    });

    useEffect(() => {
        if (readyState === ReadyState.OPEN) {
            sendMessage('requestUpdate');
        }
    }, [readyState]);

    useEffect(() => {
        if (lastMessage != null) {
            const messageType = lastMessage.data.split(':')[0];
            if (messageType === 'update') {
                setContent(JSON.parse(lastMessage.data.substring(lastMessage.data.indexOf(':') + 1)).left);
            }
        }
    }, [lastMessage]);

    return (
        <div className="fullscreen">
            <div className="App">
                <WebsocketContext.Provider value={{ sendMessage, lastMessage, readyState }}>
                    <McduScreen content={content} />
                </WebsocketContext.Provider>
            </div>
        </div>
    );
}

export default App;
