import './App.css';
import React, { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { McduScreen } from './McduScreen.jsx';
import { WebsocketContext } from './WebsocketContext.jsx';

function App() {
    const requestedId = window.process.argv[window.process.argv.length - 2];
    const [fullscreen, setFullscreen] = useState(window.location.href.endsWith('fullscreen'));
    const [screenId, setScreenId] = useState(requestedId);

    const socketUrl = `ws://localhost:8088`;

    const [content, setContent] = useState(
        {
            id: 1,
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
                ['', '', ''],
            ],
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
                const jsonIn = JSON.parse(lastMessage.data.substring(lastMessage.data.indexOf(':') + 1));
                const screenName = screenId == 2 ? 'right' : 'left';
                const newContent = jsonIn[screenName];
                if (newContent) {
                    newContent.id = screenId;
                    setContent(newContent);
                }
            }
        }
    }, [lastMessage]);

    function changeCdu(screen) {
        if (screen == screenId) {
            return;
        }
        setScreenId(screen);
        if (readyState === ReadyState.OPEN) {
            sendMessage('requestUpdate');
        }        
    }

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
