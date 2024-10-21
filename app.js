// 检查浏览器是否支持 Web Speech API
if (!('webkitSpeechRecognition' in window) || !('MediaRecorder' in window)) {
    alert('Your browser does not support speech recognition or audio recording. Please try Chrome.');
} else {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true; // 连续识别
    recognition.interimResults = true; // 显示临时结果
    recognition.lang = document.getElementById('language-select').value; // 设置语言

    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const transcriptionDiv = document.getElementById('transcription');
    let finalTranscript = '';
    let currentSegment = ''; // 当前阶段文本
    let startTime = null; // 用于记录开始时间
    let intervalId = null; // 定时器ID
    let mediaRecorder = null; // 用于录制音频
    let audioChunks = []; // 存储音频数据

    // 设置音频录制
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);

            // 当音频数据可用时，将其推入 audioChunks 数组
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            // 停止录制时，保存音频文件
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const date = new Date();
                const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}.wav`;

                // 下载文件
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = audioUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(audioUrl);
                audioChunks = []; // 清空音频数据
            };
        });

    // 开始识别
    startBtn.addEventListener('click', () => {
        recognition.lang = document.getElementById('language-select').value; // 更新语言
        finalTranscript = ''; // 重置转录文本
        currentSegment = ''; // 重置当前阶段文本
        transcriptionDiv.innerHTML = ''; // 清空文本区域
        startTime = new Date(); // 记录开始时间

        // 每30秒添加时间戳并固定当前阶段文本
        intervalId = setInterval(() => {
            const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
            if (elapsedSeconds > 0 && elapsedSeconds % 30 === 0) {
                // 将当前段落添加到 finalTranscript 中
                finalTranscript += `\n[${Math.floor(elapsedSeconds / 60)}:${elapsedSeconds % 60 < 10 ? '0' : ''}${elapsedSeconds % 60}] ${currentSegment}`;
                transcriptionDiv.innerHTML = `<p>${finalTranscript.replace(/\n/g, '<br>')}</p>`;
                currentSegment = ''; // 清空当前阶段文本
            }
        }, 1000);

        recognition.start();
        mediaRecorder.start(); // 开始录制音频
        startBtn.disabled = true;
        stopBtn.disabled = false;
    });

    // 停止识别
    stopBtn.addEventListener('click', () => {
        recognition.stop();
        mediaRecorder.stop(); // 停止录制音频
        clearInterval(intervalId); // 清除定时器
        startBtn.disabled = false;
        stopBtn.disabled = true;
    });

    // 识别结果处理
    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                currentSegment += transcript + ' ';
                // 将新的最终文本追加到 finalTranscript 中
                finalTranscript += currentSegment;
                currentSegment = '';
            } else {
                interimTranscript += transcript;
            }
        }
        transcriptionDiv.innerHTML = `<p>${finalTranscript.replace(/\n/g, '<br>')}<br><em>${interimTranscript}</em></p>`;
    };

    // 错误处理
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
    };

    // 识别结束
    recognition.onend = () => {
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };
}
