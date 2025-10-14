import React, { useContext, useEffect, useRef } from 'react'
import './Main.css'
import { assets } from '../../assets/assets'
import { Context } from '../../context/Context'

const Main = () => {

    const { 
        onSent, 
        recentPrompt, 
        showResult, 
        loading, 
        resultData, 
        setInput, 
        input,
        isListening,
        startVoiceSearch,
        stopVoiceSearch,
        uploadedImage,
        handleImageUpload,
        isProcessingAudio,
        conversationHistory
    } = useContext(Context);

    const conversationEndRef = useRef(null);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (conversationEndRef.current) {
            conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversationHistory, resultData, loading]);

    return (
        <div className='main'>
            <div className="nav">
                <p>Gemini</p>
                <img src={assets.dummy_icon} alt="" />
            </div>
            <div className="main-container">

                {conversationHistory.length === 0 ?
                    <>
                        <div className="greet">
                            <p><span>Hello, Buddy.</span></p>
                            <p>How can I help you today?</p>
                        </div>
                        <div className="cards">
                            <div className="card">
                                <p>"Where is [place name] located?" (e.g., Where is Timbuktu located?)</p>
                                <img src={assets.compass_icon} alt="" />
                            </div>
                            <div className="card">
                                <p>"What are the benefits/drawbacks of [technology/idea]?" (e.g., What are the benefits of electric cars?)</p>
                                <img src={assets.bulb_icon} alt="" />
                            </div>
                            <div className="card">
                                <p>"Tell me about [historical event/person/place]." (e.g., Tell me about World War II.)</p>
                                <img src={assets.message_icon} alt="" />
                            </div>
                            <div className="card">
                                <p>Improve the readability of the following code</p>
                                <img src={assets.code_icon} alt="" />
                            </div>
                        </div>
                    </>
                    : 
                    <div className='conversation-thread'>
                        {conversationHistory.map((message, index) => (
                            <div key={index} className={`message ${message.role}`}>
                                {message.role === 'user' ? (
                                    <div className="user-message">
                                        <img src={assets.dummy_icon} alt="" />
                                        <p>{message.content}</p>
                                    </div>
                                ) : (
                                    <div className="ai-message">
                                        <img src={assets.gemini_icon} alt="" />
                                        <p dangerouslySetInnerHTML={{ __html: message.content }}></p>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {loading && (
                            <div className="message assistant">
                                <div className="ai-message">
                                    <img src={assets.gemini_icon} alt="" />
                                    <div className='loader'>
                                        <hr />
                                        <hr />
                                        <hr />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Show current response being typed */}
                        {resultData && !loading && (
                            <div className="message assistant">
                                <div className="ai-message">
                                    <img src={assets.gemini_icon} alt="" />
                                    <p dangerouslySetInnerHTML={{ __html: resultData }}></p>
                                </div>
                            </div>
                        )}
                        
                        {/* Invisible element to scroll to */}
                        <div ref={conversationEndRef} />
                    </div>
                }

<div className="main-bottom">
    {uploadedImage && (
        <div className="image-preview">
            <img src={URL.createObjectURL(uploadedImage)} alt="Upload preview" style={{maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginBottom: '10px'}} />
            <button onClick={() => handleImageUpload(null)} style={{marginLeft: '10px', padding: '5px 10px', borderRadius: '4px', border: 'none', background: '#f44336', color: 'white', cursor: 'pointer'}}>Remove</button>
        </div>
    )}
    <div className="search-box" style={{
        border: (isListening || isProcessingAudio) ? '2px solid #4b90ff' : 'none',
        boxShadow: (isListening || isProcessingAudio) ? '0 0 10px rgba(75, 144, 255, 0.3)' : 'none'
    }}>
        {isListening && (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#4b90ff',
                fontSize: '14px',
                fontWeight: '500'
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ff4444',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite'
                }}></div>
                Recording... 
                <button 
                    onClick={stopVoiceSearch}
                    style={{
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Stop
                </button>
            </div>
        )}
        
        {isProcessingAudio && (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#4b90ff',
                fontSize: '14px',
                fontWeight: '500'
            }}>
                <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #4b90ff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                Converting audio to text...
            </div>
        )}
        
        <input 
            onChange={(e) => setInput(e.target.value)} 
            value={input} 
            type="text" 
            placeholder={
                isListening ? "🎤 Speak now..." : 
                isProcessingAudio ? "Processing..." : 
                "How can i assist you today?"
            }
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !isListening && !isProcessingAudio) onSent();
            }}
            style={{
                color: (isListening || isProcessingAudio) ? '#4b90ff' : 'inherit'
            }}
            disabled={isProcessingAudio}
        />
        <div>
            <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e.target.files[0])} 
                style={{display: 'none'}} 
                id="image-upload"
            />
            <label htmlFor="image-upload" style={{cursor: 'pointer'}}>
                <img src={assets.gallery_icon} alt="Upload image" />
            </label>
            
            {!isListening ? (
                <img 
                    src={assets.mic_icon} 
                    alt="Start recording" 
                    onClick={startVoiceSearch}
                    style={{
                        cursor: 'pointer',
                        opacity: isProcessingAudio ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                    }}
                />
            ) : (
                <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#ff4444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 1.5s infinite'
                }}
                onClick={stopVoiceSearch}
                >
                    <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'white',
                        borderRadius: '1px'
                    }}></div>
                </div>
            )}
            
            {(input || uploadedImage) && !isListening && !isProcessingAudio ? (
                <img 
                    onClick={() => onSent()} 
                    src={assets.send_icon} 
                    alt="Send" 
                    style={{cursor: 'pointer'}} 
                />
            ) : null}
        </div>
    </div>               

                    <p className="bottom-info">
                        Gemini may display inaccurate info, including about people, so double-check its response. Your privacy and Gemini Apps
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Main;
