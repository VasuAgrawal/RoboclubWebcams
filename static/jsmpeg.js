!function(t){"use strict";var e=t.jsmpeg=function(t,e){e=e||
{},this.benchmark=!!e.benchmark,this.canvas=e.canvas||document.createElement("canvas"),this.
autoplay=!!e.autoplay,this.wantsToPlay=this.autoplay,this.loop=!!e.loop,this.seekable=!!e.se
ekable,this.preserveDrawingBuffer=!!e.preserveDrawingBuffer,this.externalLoadCallback=e.onlo
ad||null,this.externalDecodeCallback=e.ondecodeframe||null,this.externalFinishedCallback=e.o
nfinished||null,this.progressive=!!e.progressive,this.progressiveThrottled=!!e.progressiveTh
rottled,this.progressiveChunkSize=e.progressiveChunkSize||262144,this.progressiveChunkSizeMa
x=4194304,this.customIntraQuantMatrix=new Uint8Array(64),this.customNonIntraQuantMatrix=new
Uint8Array(64),this.blockData=new Int32Array(64),this.zeroBlockData=new
Int32Array(64),this.fillArray(this.zeroBlockData,0),this.intraFrames=
[],!e.forceCanvas2D&&this.initWebGL()?
(this.renderFrame=this.renderFrameGL,this.updateLoader=this.updateLoaderGL):
(this.canvasContext=this.canvas.getContext("2d"),this.renderFrame=this.renderFrame2D,this.up
dateLoader=this.updateLoader2D),t instanceof WebSocket?
(this.client=t,this.client.onopen=this.initSocketClient.bind(this)):this.progressive?
this.beginProgressiveLoad(t):this.load(t)};e.prototype.waitForIntraFrame=!0,e.prototype.sock
etBufferSize=524288,e.prototype.initSocketClient=function(){this.buffer=new R(new
ArrayBuffer(this.socketBufferSize)),this.nextPictureBuffer=new R(new
ArrayBuffer(this.socketBufferSize)),this.nextPictureBuffer.writePos=0,this.nextPictureBuffer
.chunkBegin=0,this.nextPictureBuffer.lastWriteBeforeWrap=0,this.client.binaryType="arraybuffer",this.client.onmessage=this.receiveSocketMessage.bind(this)},e.prototype.decodeSocketHead
er=function(t)
{t[0]===r.charCodeAt(0)&&t[1]===r.charCodeAt(1)&&t[2]===r.charCodeAt(2)&&t[3]===r.charCodeAt
(3)&&
(this.width=256*t[4]+t[5],this.height=256*t[6]+t[7],this.initBuffers())},e.prototype.receive
SocketMessage=function(t){var e=new
Uint8Array(t.data);this.sequenceStarted||this.decodeSocketHeader(e);var
r=this.buffer,o=this.nextPictureBuffer;o.writePos+e.length>o.length&&
(o.lastWriteBeforeWrap=o.writePos,o.writePos=0,o.index=0),o.bytes.set(e,o.writePos),o.writeP
os+=e.length;for(var s=0;;)
{if(s=o.findNextMPEGStartCode(),s===R.NOT_FOUND||o.index>>3>o.writePos)return
void(o.index=Math.max(o.writePos-3,0)<<3);if(s===F)break}if(this.waitForIntraFrame)return
o.advance(10),void(o.getBits(3)===w&&(this.waitForIntraFrame=!1,o.chunkBegin=o.index-
13>>3));this.currentPictureDecoded||this.decodePicture(i);var
a=o.index>>3;if(a>o.chunkBegin)r.bytes.set(o.bytes.subarray(o.chunkBegin,a)),r.writePos=a-
o.chunkBegin;else{r.bytes.set(o.bytes.subarray(o.chunkBegin,o.lastWriteBeforeWrap));var
h=o.lastWriteBeforeWrap-
o.chunkBegin;r.bytes.set(o.bytes.subarray(0,a),h),r.writePos=a+h}r.index=0,o.chunkBegin=a,th
is.currentPictureDecoded=!1,setTimeout(function()
{this.decodePicture(),this.currentPictureDecoded=!0}.bind(this))},e.prototype.isRecording=!1
,e.prototype.recorderWaitForIntraFrame=!1,e.prototype.recordedFrames=0,e.prototype.recordedS
ize=0,e.prototype.didStartRecordingCallback=null,e.prototype.recordBuffers=
[],e.prototype.canRecord=function(){return
this.client&&this.client.readyState===this.client.OPEN},e.prototype.startRecording=function(
t){if(this.canRecord())
{this.discardRecordBuffers(),this.isRecording=!0,this.recorderWaitForIntraFrame=!0,this.didS
tartRecordingCallback=t||null,this.recordedFrames=0,this.recordedSize=0;var
e=this.width>>4,r=(15&this.width)
<<4|this.height>>8,i=255&this.height;this.recordBuffers.push(new
Uint8Array([0,0,1,179,e,r,i,19,255,255,225,88,0,0,1,184,0,8,0,0,0,0,1,0]))}},e.prototype.rec
ordFrameFromCurrentBuffer=function(){if(this.isRecording){if(this.recorderWaitForIntraFrame)
{if(this.pictureCodingType!==w)return;this.recorderWaitForIntraFrame=!1,this.didStartRecordi
ngCallback&&this.didStartRecordingCallback(this)}this.recordedFrames++,this.recordedSize+=th
is.buffer.writePos,this.recordBuffers.push(new
Uint8Array(this.buffer.bytes.subarray(0,this.buffer.writePos)))}},e.prototype.discardRecordB
uffers=function(){this.recordBuffers=
[],this.recordedFrames=0},e.prototype.stopRecording=function(){var t=new
Blob(this.recordBuffers,{type:"video/mpeg"});return
this.discardRecordBuffers(),this.isRecording=!1,t},e.prototype.intraFrames=
[],e.prototype.currentFrame=-1,e.prototype.currentTime=0,e.prototype.frameCount=0,e.prototyp
e.duration=0,e.prototype.load=function(t){this.url=t;var e=new
XMLHttpRequest,r=this;e.onreadystatechange=function()
{e.readyState==e.DONE&&200==e.status&&r.loadCallback(e.response)},e.onprogress=this.updateLo
ader.bind(this),e.open("GET",t),e.responseType="arraybuffer",e.send()},e.prototype.updateLoader2D=function(t){var
e=t.loaded/t.total,r=this.canvas.width,i=this.canvas.height,o=this.canvasContext;o.fillStyle
="#222",o.fillRect(0,0,r,i),o.fillStyle="#fff",o.fillRect(0,i-
i*e,r,i*e)},e.prototype.updateLoaderGL=function(t){var
e=this.gl;e.uniform1f(e.getUniformLocation(this.loadingProgram,"loaded"),t.loaded/t.total),e
.drawArrays(e.TRIANGLE_STRIP,0,4)},e.prototype.loadCallback=function(t){this.buffer=new
R(t),this.seekable&&
(this.collectIntraFrames(),this.buffer.index=0),this.findStartCode(v),this.firstSequenceHead
er=this.buffer.index,this.decodeSequenceHeader(),this.duration=this.frameCount/this.pictureR
ate,this.nextFrame(),this.autoplay&&this.play(),this.externalLoadCallback&&this.externalLoad
Callback(this)},e.prototype.collectIntraFrames=function(){var
t;for(t=0;this.findStartCode(F)!==R.NOT_FOUND;t++)this.buffer.advance(10),this.buffer.getBit
s(3)===w&&this.intraFrames.push({frame:t,index:this.buffer.index-
13});this.frameCount=t},e.prototype.seekToFrame=function(t,e)
{if(t<0||t>=this.frameCount||!this.intraFrames.length)return!1;for(var
r=null,o=0;o<this.intraFrames.length&&this.intraFrames[o].frame<=t;o++)r=this.intraFrames[o]
;if(this.buffer.index=r.index,this.currentFrame=r.frame-1,e){for(var
s=r.frame;s<t;s++)this.decodePicture(i),this.findStartCode(F);this.currentFrame=t-1}return
this.decodePicture(),!0},e.prototype.seekToTime=function(t,e)
{this.seekToFrame(t*this.pictureRate|0,e)},e.prototype.play=function(){this.playing||
(this.progressive?
(this.wantsToPlay=!0,this.attemptToPlay()):this._playNow())},e.prototype._playNow=function()
{this.targetTime=this.now(),this.playing=!0,this.scheduleNextFrame()},e.prototype.pause=func
tion(){this.playing=!1,this.wantsToPlay=!1},e.prototype.stop=function()
{this.currentFrame=-1,this.currentTime=0,this.wantsToPlay=!1,this.buffer&&
(this.buffer.index=this.firstSequenceHeader),this.playing=!1,this.client&&
(this.client.close(),this.client=null)},e.prototype.beginProgressiveLoad=function(t)
{this.url=t,this.progressiveLoadPositon=0,this.fileSize=0;var e=new
XMLHttpRequest,r=this;e.onreadystatechange=function(){e.readyState===e.DONE&&
(r.fileSize=parseInt(e.getResponseHeader("Content-Length")),r.buffer=new R(new
ArrayBuffer(r.fileSize)),r.buffer.writePos=0,r.loadNextChunk())},e.open("HEAD",t),e.send()},
e.prototype.maybeLoadNextChunk=function()
{!this.chunkIsLoading&&this.buffer.index>>3>this.nextChunkLoadAt&&this.progressiveLoadFails<
5&&this.loadNextChunk()},e.prototype.loadNextChunk=function(){var
t=this,e=this.buffer.writePos,r=Math.min(this.buffer.writePos+t.progressiveChunkSize-
1,this.fileSize-1);if(!(e>=this.fileSize))
{this.chunkIsLoading=!0,this.chunkLoadStart=Date.now();var i=new
XMLHttpRequest;i.onreadystatechange=function()
{i.readyState===i.DONE&&i.status>200&&i.status<300?
(t.progressiveLoadFails=0,t.progressiveLoadCallback(i.response)):i.readyState===i.DONE&&
(t.chunkIsLoading=!1,t.progressiveLoadFails++,t.maybeLoadNextChunk())},0===e&&
(i.onprogress=this.updateLoader.bind(this)),i.open("GET",this.url+"?"+e+"-"+r),i.setRequestHeader("Range","bytes="+e+"-"+r),i.responseType="arraybuffer",i.send()}},e.prototype.canPlayThrough=!1,e.prototype.progr
essiveLoadCallback=function(t){this.chunkIsLoading=!1;var e=0===this.buffer.writePos,r=new
Uint8Array(t);this.buffer.bytes.set(r,this.buffer.writePos),this.buffer.writePos+=r.length,e
&&
(this.findStartCode(v),this.firstSequenceHeader=this.buffer.index,this.decodeSequenceHeader(
));var i=(Date.now()-
this.chunkLoadStart)/1e3,o=this.buffer.index>>3,s=r.length/i,a=0;if(this.currentTime>0)a=o/t
his.currentTime;else{var h=this.buffer.index;this.buffer.index=this.buffer.writePos-
r.length<<3;var
n;for(n=0;this.findStartCode(F)!==R.NOT_FOUND;n++);this.buffer.index=h,a=r.length/(n/this.pi
ctureRate)}var d=(this.buffer.writePos-o)/a,c=(this.fileSize-this.buffer.writePos)/s,f=
(this.fileSize-o)/a;if(this.canPlayThrough=f>c,d>8*i&&
(this.progressiveChunkSize=Math.min(2*this.progressiveChunkSize,this.progressiveChunkSizeMax
)),this.progressiveThrottled&&this.canPlayThrough?this.nextChunkLoadAt=this.buffer.writePos-
2*this.progressiveChunkSize-this.progressiveChunkSize*
(a/s)*4:this.nextChunkLoadAt=0,this.buffer.writePos>=this.fileSize)
{if(this.lastFrameIndex=this.buffer.writePos<<3,this.canPlayThrough=!0,this.seekable){var
u=this.buffer.index;this.buffer.index=0,this.collectIntraFrames(),this.buffer.index=u}this.e
xternalLoadCallback&&this.externalLoadCallback(this)}else
this.lastFrameIndex=this.findLastPictureStartCode(),this.maybeLoadNextChunk();this.attemptTo
Play()},e.prototype.findLastPictureStartCode=function(){for(var
t=this.buffer.bytes,e=this.buffer.writePos;e>3;e--)if(t[e]==F&&1==t[e-1]&&0==t[e-2]&&0==t[e-3])return e-3<<3;return 0},e.prototype.attemptToPlay=function()
{!this.playing&&this.wantsToPlay&&this.canPlayThrough&&this._playNow()},e.prototype.readCode
=function(t){var e=0;do e=t[e+this.buffer.getBits(1)];while(e>=0&&0!==t[e]);return
t[e+2]},e.prototype.findStartCode=function(t){for(var
e=0;;)if(e=this.buffer.findNextMPEGStartCode(),e===t||e===R.NOT_FOUND)return e;return
R.NOT_FOUND},e.prototype.fillArray=function(t,e){for(var
r=0,i=t.length;r<i;r++)t[r]=e},e.prototype.pictureRate=30,e.prototype.lateTime=0,e.prototype
.firstSequenceHeader=0,e.prototype.targetTime=0,e.prototype.benchmark=!1,e.prototype.benchFr
ame=0,e.prototype.benchDecodeTimes=0,e.prototype.benchAvgFrameTime=0,e.prototype.now=functio
n(){return t.performance?t.performance.now():Date.now()},e.prototype.nextFrame=function()
{if(this.buffer)for(var t=this.now();;){var
e=this.buffer.findNextMPEGStartCode();if(e===v)this.decodeSequenceHeader();else{if(e===F)ret
urn this.progressive&&this.buffer.index>=this.lastFrameIndex?(this.playing=!1,void
this.maybeLoadNextChunk()):
(this.playing&&this.scheduleNextFrame(),this.decodePicture(),this.benchDecodeTimes+=this.now
()-t,this.canvas);if(e===R.NOT_FOUND)return
this.stop(),this.externalFinishedCallback&&this.externalFinishedCallback(this),this.loop&&th
is.sequenceStarted&&this.play(),null}}},e.prototype.scheduleNextFrame=function()
{this.lateTime=this.now()-this.targetTime;var e=Math.max(0,1e3/this.pictureRate-
this.lateTime);this.targetTime=this.now()+e,this.benchmark&&
(this.benchFrame++,this.benchFrame>=120&&
(this.benchAvgFrameTime=this.benchDecodeTimes/this.benchFrame,this.benchFrame=0,this.benchDe
codeTimes=0,t.console&&console.log("Average time per frame:",this.benchAvgFrameTime,"ms")),setTimeout(this.nextFrame.bind(this),0)),setTimeout(this.nextFrame.bind(this),Math.max(e,1))},e.prototype.decodeSequenceHeader=function()
{this.width=this.buffer.getBits(12),this.height=this.buffer.getBits(12),this.buffer.advance(
4),this.pictureRate=o[this.buffer.getBits(4)],this.buffer.advance(30),this.initBuffers();var
t;if(this.buffer.getBits(1))
{for(t=0;t<64;t++)this.customIntraQuantMatrix[s[t]]=this.buffer.getBits(8);this.intraQuantMa
trix=this.customIntraQuantMatrix}if(this.buffer.getBits(1))
{for(t=0;t<64;t++)this.customNonIntraQuantMatrix[s[t]]=this.buffer.getBits(8);this.nonIntraQ
uantMatrix=this.customNonIntraQuantMatrix}},e.prototype.initBuffers=function()
{if(this.intraQuantMatrix=a,this.nonIntraQuantMatrix=h,this.mbWidth=this.width+15>>4,this.mb
Height=this.height+15>>4,this.mbSize=this.mbWidth*this.mbHeight,this.codedWidth=this.mbWidth
<<4,this.codedHeight=this.mbHeight<<4,this.codedSize=this.codedWidth*this.codedHeight,this.h
alfWidth=this.mbWidth<<3,this.halfHeight=this.mbHeight<<3,this.quarterSize=this.codedSize>>2
,!this.sequenceStarted){this.sequenceStarted=!0;var
e=t.Uint8ClampedArray||t.Uint8Array;t.Uint8ClampedArray||
(this.copyBlockToDestination=this.copyBlockToDestinationClamp,this.addBlockToDestination=thi
s.addBlockToDestinationClamp),this.currentY=new e(this.codedSize),this.currentY32=new
Uint32Array(this.currentY.buffer),this.currentCr=new
e(this.codedSize>>2),this.currentCr32=new
Uint32Array(this.currentCr.buffer),this.currentCb=new
e(this.codedSize>>2),this.currentCb32=new
Uint32Array(this.currentCb.buffer),this.forwardY=new e(this.codedSize),this.forwardY32=new
Uint32Array(this.forwardY.buffer),this.forwardCr=new
e(this.codedSize>>2),this.forwardCr32=new
Uint32Array(this.forwardCr.buffer),this.forwardCb=new
e(this.codedSize>>2),this.forwardCb32=new
Uint32Array(this.forwardCb.buffer),this.canvas.width=this.width,this.canvas.height=this.heig
ht,this.gl?(this.gl.useProgram(this.program),this.gl.viewport(0,0,this.width,this.height)):
(this.currentRGBA=this.canvasContext.getImageData(0,0,this.width,this.height),this.fillArray
(this.currentRGBA.data,255))}},e.prototype.currentY=null,e.prototype.currentCr=null,e.protot
ype.currentCb=null,e.prototype.currentRGBA=null,e.prototype.pictureCodingType=0,e.prototype.
forwardY=null,e.prototype.forwardCr=null,e.prototype.forwardCb=null,e.prototype.fullPelForwa
rd=!1,e.prototype.forwardFCode=0,e.prototype.forwardRSize=0,e.prototype.forwardF=0,e.prototy
pe.decodePicture=function(t)
{if(this.currentFrame++,this.currentTime=this.currentFrame/this.pictureRate,this.progressive
&&this.maybeLoadNextChunk(),this.buffer.advance(10),this.pictureCodingType=this.buffer.getBi
ts(3),this.buffer.advance(16),!(this.pictureCodingType<=0||this.pictureCodingType>=C))
{if(this.pictureCodingType===g)
{if(this.fullPelForward=this.buffer.getBits(1),this.forwardFCode=this.buffer.getBits(3),0===
this.forwardFCode)return;this.forwardRSize=this.forwardFCode-
1,this.forwardF=1<<this.forwardRSize}var e=0;do
e=this.buffer.findNextMPEGStartCode();while(e===k||e===P);for(;e>=T&&e<=x;)this.decodeSlice(255&e),e=this.buffer.findNextMPEGStartCode();if(this.buffer.rewind(32),this.recordFrameFromC
urrentBuffer(),t!==i&&
(this.renderFrame(),this.externalDecodeCallback&&this.externalDecodeCallback(this,this.canva
s)),this.pictureCodingType===w||this.pictureCodingType===g){var
r=this.forwardY,o=this.forwardY32,s=this.forwardCr,a=this.forwardCr32,h=this.forwardCb,n=thi
s.forwardCb32;this.forwardY=this.currentY,this.forwardY32=this.currentY32,this.forwardCr=thi
s.currentCr,this.forwardCr32=this.currentCr32,this.forwardCb=this.currentCb,this.forwardCb32
=this.currentCb32,this.currentY=r,this.currentY32=o,this.currentCr=s,this.currentCr32=a,this
.currentCb=h,this.currentCb32=n}}},e.prototype.YCbCrToRGBA=function(){for(var
t,e,r,i,o,s=this.currentY,a=this.currentCb,h=this.currentCr,n=this.currentRGBA.data,d=0,c=th
is.codedWidth,f=this.codedWidth+(this.codedWidth-this.width),u=0,l=this.halfWidth-
(this.width>>1),p=0,b=4*this.width,m=4*this.width,y=this.width>>1,w=this.height>>1,g=0;g<w;g
++){for(var C=0;C<y;C++){t=a[u],e=h[u],u++,r=e+(103*e>>8)-179,i=(88*t>>8)-44+
(183*e>>8)-91,o=t+(198*t>>8)-227;var v=s[d++],T=s[d++];n[p]=v+r,n[p+1]=v-
i,n[p+2]=v+o,n[p+4]=T+r,n[p+5]=T-i,n[p+6]=T+o,p+=8;var x=s[c++],F=s[c++];n[b]=x+r,n[b+1]=x-
i,n[b+2]=x+o,n[b+4]=F+r,n[b+5]=F-
i,n[b+6]=F+o,b+=8}d+=f,c+=f,p+=m,b+=m,u+=l}},e.prototype.renderFrame2D=function()
{this.YCbCrToRGBA(),this.canvasContext.putImageData(this.currentRGBA,0,0)},e.prototype.gl=nu
ll,e.prototype.program=null,e.prototype.YTexture=null,e.prototype.CBTexture=null,e.prototype
.CRTexture=null,e.prototype.createTexture=function(t,e){var
r=this.gl,i=r.createTexture();return
r.bindTexture(r.TEXTURE_2D,i),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r.LINEAR),r.
texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.LINEAR),r.texParameteri(r.TEXTURE_2D,r.TEX
TURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),
r.uniform1i(r.getUniformLocation(this.program,e),t),i},e.prototype.compileShader=function(t,
e){var
r=this.gl,i=r.createShader(t);if(r.shaderSource(i,e),r.compileShader(i),!r.getShaderParamete
r(i,r.COMPILE_STATUS))throw new Error(r.getShaderInfoLog(i));return
i},e.prototype.initWebGL=function(){var t;try{var e=
{preserveDrawingBuffer:this.preserveDrawingBuffer};t=this.gl=this.canvas.getContext("webgl",
e)||this.canvas.getContext("experimental-webgl",e)}catch(t)
{return!1}if(!t)return!1;if(this.buffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.bu
ffer),t.bufferData(t.ARRAY_BUFFER,new
Float32Array([0,0,0,1,1,0,1,1]),t.STATIC_DRAW),this.program=t.createProgram(),t.attachShader
(this.program,this.compileShader(t.VERTEX_SHADER,B)),t.attachShader(this.program,this.compil
eShader(t.FRAGMENT_SHADER,S)),t.linkProgram(this.program),!t.getProgramParameter(this.progra
m,t.LINK_STATUS))throw new
Error(t.getProgramInfoLog(this.program));t.useProgram(this.program),this.YTexture=this.creat
eTexture(0,"YTexture"),this.CBTexture=this.createTexture(1,"CBTexture"),this.CRTexture=this.
createTexture(2,"CRTexture");var r=t.getAttribLocation(this.program,"vertex");return
t.enableVertexAttribArray(r),t.vertexAttribPointer(r,2,t.FLOAT,!1,0,0),this.loadingProgram=t
.createProgram(),t.attachShader(this.loadingProgram,this.compileShader(t.VERTEX_SHADER,B)),t
.attachShader(this.loadingProgram,this.compileShader(t.FRAGMENT_SHADER,A)),t.linkProgram(thi
s.loadingProgram),t.useProgram(this.loadingProgram),r=t.getAttribLocation(this.loadingProgra
m,"vertex"),t.enableVertexAttribArray(r),t.vertexAttribPointer(r,2,t.FLOAT,!1,0,0),!0},e.pro
totype.renderFrameGL=function(){var t=this.gl,e=new Uint8Array(this.currentY.buffer),r=new
Uint8Array(this.currentCr.buffer),i=new
Uint8Array(this.currentCb.buffer);t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,thi
s.YTexture),t.texImage2D(t.TEXTURE_2D,0,t.LUMINANCE,this.codedWidth,this.height,0,t.LUMINANC
E,t.UNSIGNED_BYTE,e),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.CBTexture),
t.texImage2D(t.TEXTURE_2D,0,t.LUMINANCE,this.halfWidth,this.height/2,0,t.LUMINANCE,t.UNSIGNE
D_BYTE,r),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,this.CRTexture),t.texImage2
D(t.TEXTURE_2D,0,t.LUMINANCE,this.halfWidth,this.height/2,0,t.LUMINANCE,t.UNSIGNED_BYTE,i),t
.drawArrays(t.TRIANGLE_STRIP,0,4)},e.prototype.quantizerScale=0,e.prototype.sliceBegin=!1,e.
prototype.decodeSlice=function(t){for(this.sliceBegin=!0,this.macroblockAddress=(t-
1)*this.mbWidth-
1,this.motionFwH=this.motionFwHPrev=0,this.motionFwV=this.motionFwVPrev=0,this.dcPredictorY=
128,this.dcPredictorCr=128,this.dcPredictorCb=128,this.quantizerScale=this.buffer.getBits(5)
;this.buffer.getBits(1);)this.buffer.advance(8);do
this.decodeMacroblock();while(!this.buffer.nextBytesAreStartCode())},e.prototype.macroblockA
ddress=0,e.prototype.mbRow=0,e.prototype.mbCol=0,e.prototype.macroblockType=0,e.prototype.ma
croblockIntra=!1,e.prototype.macroblockMotFw=!1,e.prototype.motionFwH=0,e.prototype.motionFw
V=0,e.prototype.motionFwHPrev=0,e.prototype.motionFwVPrev=0,e.prototype.decodeMacroblock=fun
ction(){for(var
t=0,e=this.readCode(d);34===e;)e=this.readCode(d);for(;35===e;)t+=33,e=this.readCode(d);if(t+=e,this.sliceBegin)this.sliceBegin=!1,this.macroblockAddress+=t;else{if(this.macroblockAddr
ess+t>=this.mbSize)return;for(t>1&&
(this.dcPredictorY=128,this.dcPredictorCr=128,this.dcPredictorCb=128,this.pictureCodingType=
==g&&
(this.motionFwH=this.motionFwHPrev=0,this.motionFwV=this.motionFwVPrev=0));t>1;)this.macrobl
ockAddress++,this.mbRow=this.macroblockAddress/this.mbWidth|0,this.mbCol=this.macroblockAddr
ess%this.mbWidth,this.copyMacroblock(this.motionFwH,this.motionFwV,this.forwardY,this.forwar
dCr,this.forwardCb),t-
-;this.macroblockAddress++}this.mbRow=this.macroblockAddress/this.mbWidth|0,this.mbCol=this.
macroblockAddress%this.mbWidth,this.macroblockType=this.readCode(D[this.pictureCodingType]),
this.macroblockIntra=1&this.macroblockType,this.macroblockMotFw=8&this.macroblockType,0!==
(16&this.macroblockType)&&(this.quantizerScale=this.buffer.getBits(5)),this.macroblockIntra?
(this.motionFwH=this.motionFwHPrev=0,this.motionFwV=this.motionFwVPrev=0):
(this.dcPredictorY=128,this.dcPredictorCr=128,this.dcPredictorCb=128,this.decodeMotionVector
s(),this.copyMacroblock(this.motionFwH,this.motionFwV,this.forwardY,this.forwardCr,this.forw
ardCb));for(var r=0!==(2&this.macroblockType)?this.readCode(l):this.macroblockIntra?
63:0,i=0,o=32;i<6;i++)0!==
(r&o)&&this.decodeBlock(i),o>>=1},e.prototype.decodeMotionVectors=function(){var
t,e,r=0;this.macroblockMotFw?(t=this.readCode(p),0!==t&&1!==this.forwardF?
(r=this.buffer.getBits(this.forwardRSize),e=(Math.abs(t)-1<<this.forwardRSize)+r+1,t<0&&(e=-
e)):e=t,this.motionFwHPrev+=e,this.motionFwHPrev>(this.forwardF<<4)-1?this.motionFwHPrev-
=this.forwardF<<5:this.motionFwHPrev<-this.forwardF<<4&&
(this.motionFwHPrev+=this.forwardF<<5),this.motionFwH=this.motionFwHPrev,this.fullPelForward
&&(this.motionFwH<<=1),t=this.readCode(p),0!==t&&1!==this.forwardF?
(r=this.buffer.getBits(this.forwardRSize),e=(Math.abs(t)-1<<this.forwardRSize)+r+1,t<0&&(e=-
e)):e=t,this.motionFwVPrev+=e,this.motionFwVPrev>(this.forwardF<<4)-1?this.motionFwVPrev-
=this.forwardF<<5:this.motionFwVPrev<-this.forwardF<<4&&
(this.motionFwVPrev+=this.forwardF<<5),this.motionFwV=this.motionFwVPrev,this.fullPelForward
&&(this.motionFwV<<=1)):this.pictureCodingType===g&&
(this.motionFwH=this.motionFwHPrev=0,this.motionFwV=this.motionFwVPrev=0)},e.prototype.copyM
acroblock=function(t,e,r,i,o){var
s,a,h,n,d,c,f,u,l,p=this.currentY32,b=this.currentCb32,m=this.currentCr32;s=this.codedWidth,
a=s-16,h=t>>1,n=e>>1,d=1===(1&t),c=1===(1&e),f=((this.mbRow<<4)+n)*s+
(this.mbCol<<4)+h,u=this.mbRow*s+this.mbCol<<2,l=u+(s<<2);var y,w,g,C;if(d)if(c)for(;u<l;)
{for(w=r[f]+r[f+s],f++,y=0;y<4;y++)g=r[f]+r[f+s],f++,C=w+g+2>>2&255,w=r[f]+r[f+s],f++,C|=w+g
+2<<6&65280,g=r[f]+r[f+s],f++,C|=w+g+2<<14&16711680,w=r[f]+r[f+s],f++,C|=w+g+2<<22&427819008
0,p[u++]=C;u+=a>>2,f+=a-1}else for(;u<l;)
{for(w=r[f++],y=0;y<4;y++)g=r[f++],C=w+g+1>>1&255,w=r[f++],C|=w+g+1<<7&65280,g=r[f++],C|=w+g
+1<<15&16711680,w=r[f++],C|=w+g+1<<23&4278190080,p[u++]=C;u+=a>>2,f+=a-1}else
if(c)for(;u<l;)
{for(y=0;y<4;y++)C=r[f]+r[f+s]+1>>1&255,f++,C|=r[f]+r[f+s]+1<<7&65280,f++,C|=r[f]+r[f+s]+1<<
15&16711680,f++,C|=r[f]+r[f+s]+1<<23&4278190080,f++,p[u++]=C;u+=a>>2,f+=a}else for(;u<l;)
{for(y=0;y<4;y++)C=r[f],f++,C|=r[f]<<8,f++,C|=r[f]<<16,f++,C|=r[f]
<<24,f++,p[u++]=C;u+=a>>2,f+=a}s=this.halfWidth,a=s-8,h=t/2>>1,n=e/2>>1,d=1===(t/2&1),c=1===
(e/2&1),f=((this.mbRow<<3)+n)*s+(this.mbCol<<3)+h,u=this.mbRow*s+this.mbCol<<1,l=u+
(s<<1);var v,T,x,F,k,P;if(d)if(c)for(;u<l;)
{for(v=i[f]+i[f+s],F=o[f]+o[f+s],f++,y=0;y<2;y++)T=i[f]+i[f+s],k=o[f]+o[f+s],f++,x=v+T+2>>2&
255,P=F+k+2>>2&255,v=i[f]+i[f+s],F=o[f]+o[f+s],f++,x|=v+T+2<<6&65280,P|=F+k+2<<6&65280,T=i[f
]+i[f+s],k=o[f]+o[f+s],f++,x|=v+T+2<<14&16711680,P|=F+k+2<<14&16711680,v=i[f]+i[f+s],F=o[f]+
o[f+s],f++,x|=v+T+2<<22&4278190080,P|=F+k+2<<22&4278190080,m[u]=x,b[u]=P,u++;u+=a>>2,f+=a-
1}else for(;u<l;)
{for(v=i[f],F=o[f],f++,y=0;y<2;y++)T=i[f],k=o[f++],x=v+T+1>>1&255,P=F+k+1>>1&255,v=i[f],F=o[
f++],x|=v+T+1<<7&65280,P|=F+k+1<<7&65280,T=i[f],k=o[f++],x|=v+T+1<<15&16711680,P|=F+k+1<<15&
16711680,v=i[f],F=o[f++],x|=v+T+1<<23&4278190080,P|=F+k+1<<23&4278190080,m[u]=x,b[u]=P,u++;u
+=a>>2,f+=a-1}else if(c)for(;u<l;)
{for(y=0;y<2;y++)x=i[f]+i[f+s]+1>>1&255,P=o[f]+o[f+s]+1>>1&255,f++,x|=i[f]+i[f+s]+1<<7&65280
,P|=o[f]+o[f+s]+1<<7&65280,f++,x|=i[f]+i[f+s]+1<<15&16711680,P|=o[f]+o[f+s]+1<<15&16711680,f
++,x|=i[f]+i[f+s]+1<<23&4278190080,P|=o[f]+o[f+s]+1<<23&4278190080,f++,m[u]=x,b[u]=P,u++;u+=
a>>2,f+=a}else for(;u<l;){for(y=0;y<2;y++)x=i[f],P=o[f],f++,x|=i[f]<<8,P|=o[f]
<<8,f++,x|=i[f]<<16,P|=o[f]<<16,f++,x|=i[f]<<24,P|=o[f]
<<24,f++,m[u]=x,b[u]=P,u++;u+=a>>2,f+=a}},e.prototype.blockData=null,e.prototype.decodeBlock
=function(t){var e,r=0;if(this.macroblockIntra){var i,o;if(t<4?
(i=this.dcPredictorY,o=this.readCode(b)):(i=4===t?
this.dcPredictorCr:this.dcPredictorCb,o=this.readCode(m)),o>0){var
a=this.buffer.getBits(o);0!==(a&1<<o-1)?this.blockData[0]=i+a:this.blockData[0]=i+(-1<<o|a+1)}else this.blockData[0]=i;t<4?this.dcPredictorY=this.blockData[0]:4===t?
this.dcPredictorCr=this.blockData[0]:this.dcPredictorCb=this.blockData[0],this.blockData[0]
<<=8,e=this.intraQuantMatrix,r=1}else e=this.nonIntraQuantMatrix;for(var h=0;;){var
d=0,c=this.readCode(y);if(1===c&&r>0&&0===this.buffer.getBits(1))break;65535===c?
(d=this.buffer.getBits(6),h=this.buffer.getBits(8),0===h?h=this.buffer.getBits(8):128===h?
h=this.buffer.getBits(8)-256:h>128&&(h-=256)):(d=c>>8,h=255&c,this.buffer.getBits(1)&&(h=-
h)),r+=d;var f=s[r];r++,h<<=1,this.macroblockIntra||(h+=h<0?
-1:1),h=h*this.quantizerScale*e[f]>>4,0===(1&h)&&(h-=h>0?1:-1),h>2047?h=2047:h<-2048&&
(h=-2048),this.blockData[f]=h*n[f]}var u,l,p;t<4?(u=this.currentY,p=this.codedWidth-
8,l=this.mbRow*this.codedWidth+this.mbCol<<4,0!==(1&t)&&(l+=8),0!==(2&t)&&
(l+=this.codedWidth<<3)):(u=4===t?this.currentCb:this.currentCr,p=(this.codedWidth>>1)-8,l=
(this.mbRow*this.codedWidth<<2)+(this.mbCol<<3)),this.macroblockIntra?1===r?
(this.copyValueToDestination(this.blockData[0]+128>>8,u,l,p),this.blockData[0]=0):
(this.IDCT(),this.copyBlockToDestination(this.blockData,u,l,p),this.blockData.set(this.zeroB
lockData)):1===r?
(this.addValueToDestination(this.blockData[0]+128>>8,u,l,p),this.blockData[0]=0):
(this.IDCT(),this.addBlockToDestination(this.blockData,u,l,p),this.blockData.set(this.zeroBl
ockData)),r=0},e.prototype.copyBlockToDestination=function(t,e,r,i){for(var
o=0;o<64;o+=8,r+=i+8)e[r+0]=t[o+0],e[r+1]=t[o+1],e[r+2]=t[o+2],e[r+3]=t[o+3],e[r+4]=t[o+4],e
[r+5]=t[o+5],e[r+6]=t[o+6],e[r+7]=t[o+7]},e.prototype.addBlockToDestination=function(t,e,r,i
){for(var
o=0;o<64;o+=8,r+=i+8)e[r+0]+=t[o+0],e[r+1]+=t[o+1],e[r+2]+=t[o+2],e[r+3]+=t[o+3],e[r+4]+=t[o
+4],e[r+5]+=t[o+5],e[r+6]+=t[o+6],e[r+7]+=t[o+7]},e.prototype.copyValueToDestination=functio
n(t,e,r,i){for(var
o=0;o<64;o+=8,r+=i+8)e[r+0]=t,e[r+1]=t,e[r+2]=t,e[r+3]=t,e[r+4]=t,e[r+5]=t,e[r+6]=t,e[r+7]=t
},e.prototype.addValueToDestination=function(t,e,r,i){for(var
o=0;o<64;o+=8,r+=i+8)e[r+0]+=t,e[r+1]+=t,e[r+2]+=t,e[r+3]+=t,e[r+4]+=t,e[r+5]+=t,e[r+6]+=t,e
[r+7]+=t},e.prototype.copyBlockToDestinationClamp=function(t,e,r,i){for(var o=0,s=0;s<8;s++)
{for(var a=0;a<8;a++){var h=t[o++];e[r++]=h>255?255:h<0?
0:h}r+=i}},e.prototype.addBlockToDestinationClamp=function(t,e,r,i){for(var o=0,s=0;s<8;s++)
{for(var a=0;a<8;a++){var h=t[o++]+e[r];e[r++]=h>255?255:h<0?
0:h}r+=i}},e.prototype.IDCT=function(){var
t,e,r,i,o,s,a,h,n,d,c,f,u,l,p,b,m,y,w,g=this.blockData;for(w=0;w<8;++w)t=g[32+w],e=g[16+w]+g
[48+w],r=g[40+w]-g[24+w],s=g[8+w]+g[56+w],a=g[24+w]+g[40+w],i=g[8+w]-
g[56+w],o=s+a,h=g[0+w],u=(473*i-196*r+128>>8)-o,n=u-(362*(s-a)+128>>8),d=h-t,c=(362*
(g[16+w]-g[48+w])+128>>8)-e,f=h+t,l=d+c,p=f+e,b=d-c,m=f-e,y=-n-
(473*r+196*i+128>>8),g[0+w]=o+p,g[8+w]=u+l,g[16+w]=b-n,g[24+w]=m-
y,g[32+w]=m+y,g[40+w]=n+b,g[48+w]=l-u,g[56+w]=p-
o;for(w=0;w<64;w+=8)t=g[4+w],e=g[2+w]+g[6+w],r=g[5+w]-
g[3+w],s=g[1+w]+g[7+w],a=g[3+w]+g[5+w],i=g[1+w]-g[7+w],o=s+a,h=g[0+w],u=(473*i-
196*r+128>>8)-o,n=u-(362*(s-a)+128>>8),d=h-t,c=(362*(g[2+w]-g[6+w])+128>>8)-
e,f=h+t,l=d+c,p=f+e,b=d-c,m=f-e,y=-n-
(473*r+196*i+128>>8),g[0+w]=o+p+128>>8,g[1+w]=u+l+128>>8,g[2+w]=b-n+128>>8,g[3+w]=m-
y+128>>8,g[4+w]=m+y+128>>8,g[5+w]=n+b+128>>8,g[6+w]=l-u+128>>8,g[7+w]=p-o+128>>8};var
r="jsmp",i=1,o=[0,23.976,24,25,29.97,30,50,59.94,60,0,0,0,0,0,0,0],s=new
Uint8Array([0,1,8,16,9,2,3,10,17,24,32,25,18,11,4,5,12,19,26,33,40,48,41,34,27,20,13,6,7,14,
21,28,35,42,49,56,57,50,43,36,29,22,15,23,30,37,44,51,58,59,52,45,38,31,39,46,53,60,61,54,47
,55,62,63]),a=new
Uint8Array([8,16,19,22,26,27,29,34,16,16,22,24,27,29,34,37,19,22,26,27,29,34,34,38,22,22,26,
27,29,34,37,40,22,26,27,29,32,35,40,48,26,27,29,32,35,40,48,58,26,27,29,34,38,46,56,69,27,29
,35,38,46,56,69,83]),h=new
Uint8Array([16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16
,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,1
6,16,16,16,16,16,16]),n=new
Uint8Array([32,44,42,38,32,25,17,9,44,62,58,52,44,35,24,12,42,58,55,49,42,33,23,12,38,52,49,
44,38,30,20,10,32,44,42,38,32,25,17,9,25,35,33,30,25,20,14,7,17,24,23,20,17,14,9,5,9,12,12,1
0,9,7,5,2]),d=new
Int16Array([3,6,0,9,12,0,0,0,1,15,18,0,21,24,0,27,30,0,33,36,0,0,0,3,0,0,2,39,42,0,45,48,0,0
,0,5,0,0,4,51,54,0,57,60,0,0,0,7,0,0,6,63,66,0,69,72,0,75,78,0,81,84,0,-1,87,0,-1,90,0,93,96
,0,99,102,0,105,108,0,111,114,0,0,0,9,0,0,8,117,120,0,123,126,0,129,132,0,135,138,0,0,0,15,0
,0,14,0,0,13,0,0,12,0,0,11,0,0,10,141,-1,0,-1,144,0,147,150,0,153,156,0,159,162,0,165,168,0,
171,174,0,177,180,0,183,-1,0,-1,186,0,189,192,0,195,198,0,201,204,0,207,210,0,213,216,0,219,
222,0,0,0,21,0,0,20,0,0,19,0,0,18,0,0,17,0,0,16,0,0,35,0,0,34,0,0,33,0,0,32,0,0,31,0,0,30,0,
0,29,0,0,28,0,0,27,0,0,26,0,0,25,0,0,24,0,0,23,0,0,22]),c=new
Int8Array([3,6,0,-1,9,0,0,0,1,0,0,17]),f=newInt8Array([3,6,0,9,12,0,0,0,10,15,18,0,0,0,2,21,24,0,0,0,8,27,30,0,33,36,0,-1,39,0,0,0,18,0,
0,26,0,0,1,0,0,17]),u=new
Int8Array([3,6,0,9,15,0,12,18,0,24,21,0,0,0,12,27,30,0,0,0,14,39,42,0,36,33,0,0,0,4,0,0,6,54
,48,0,45,51,0,0,0,8,0,0,10,-1,57,0,0,0,1,60,63,0,0,0,30,0,0,17,0,0,22,0,0,26]),l=new
Int16Array([6,3,0,9,18,0,12,15,0,24,33,0,36,39,0,27,21,0,30,42,0,60,57,0,54,48,0,69,51,0,81,
75,0,63,84,0,45,66,0,72,78,0,0,0,60,105,120,0,132,144,0,114,108,0,126,141,0,87,93,0,117,96,0
,0,0,32,135,138,0,99,123,0,129,102,0,0,0,4,90,111,0,0,0,8,0,0,16,0,0,44,150,168,0,0,0,28,0,0
,52,0,0,62,183,177,0,156,180,0,0,0,1,165,162,0,0,0,61,0,0,56,171,174,0,0,0,2,0,0,40,153,186,
0,0,0,48,192,189,0,147,159,0,0,0,20,0,0,12,240,249,0,0,0,63,231,225,0,195,219,0,252,198,0,0,
0,24,0,0,36,0,0,3,207,261,0,243,237,0,204,213,0,210,234,0,201,228,0,216,222,0,258,255,0,264,
246,0,-1,282,0,285,291,0,0,0,33,0,0,9,318,330,0,306,348,0,0,0,5,0,0,10,279,267,0,0,0,6,0,0,1
8,0,0,17,0,0,34,339,357,0,309,312,0,270,276,0,327,321,0,351,354,0,303,297,0,294,288,0,300,27
3,0,342,345,0,315,324,0,336,333,0,363,375,0,0,0,41,0,0,14,0,0,21,372,366,0,360,369,0,0,0,11,
0,0,19,0,0,7,0,0,35,0,0,13,0,0,50,0,0,49,0,0,58,0,0,37,0,0,25,0,0,45,0,0,57,0,0,26,0,0,29,0,
0,38,0,0,53,0,0,23,0,0,43,0,0,46,0,0,42,0,0,22,0,0,54,0,0,51,0,0,15,0,0,30,0,0,39,0,0,47,0,0
,55,0,0,27,0,0,59,0,0,31]),p=new
Int16Array([3,6,0,12,9,0,0,0,0,18,15,0,24,21,0,0,0,-1,0,0,1,27,30,0,36,33,0,0,0,2,0,0,-2,42,
45,0,48,39,0,60,54,0,0,0,3,0,0,-3,51,57,0,-1,69,0,81,75,0,78,63,0,72,66,0,96,84,0,87,93,0,-1
,99,0,108,105,0,0,0,-4,90,102,0,0,0,4,0,0,-7,0,0,5,111,123,0,0,0,-5,0,0,7,114,120,0,126,117,
0,0,0,-6,0,0,6,153,162,0,150,147,0,135,138,0,156,141,0,129,159,0,132,144,0,0,0,10,0,0,9,0,0,
8,0,0,-8,171,198,0,0,0,-9,180,192,0,168,183,0,165,186,0,174,189,0,0,0,-10,177,195,0,0,0,12,0
,0,16,0,0,13,0,0,14,0,0,11,0,0,15,0,0,-16,0,0,-12,0,0,-14,0,0,-15,0,0,-11,0,0,-13]),b=new
Int8Array([6,3,0,18,15,0,9,12,0,0,0,1,0,0,2,27,24,0,21,30,0,0,0,0,36,33,0,0,0,4,0,0,3,39,42,
0,0,0,5,0,0,6,48,45,0,51,-1,0,0,0,7,0,0,8]),m=new
Int8Array([6,3,0,12,9,0,18,15,0,24,21,0,0,0,2,0,0,1,0,0,0,30,27,0,0,0,3,36,33,0,0,0,4,42,39,
0,0,0,5,48,45,0,0,0,6,51,-1,0,0,0,7,0,0,8]),y=new
Int32Array([3,6,0,12,9,0,0,0,1,21,24,0,18,15,0,39,27,0,33,30,0,42,36,0,0,0,257,60,66,0,54,63
,0,48,57,0,0,0,513,51,45,0,0,0,2,0,0,3,81,75,0,87,93,0,72,78,0,96,90,0,0,0,1025,69,84,0,0,0,
769,0,0,258,0,0,1793,0,0,65535,0,0,1537,111,108,0,0,0,1281,105,102,0,117,114,0,99,126,0,120,
123,0,156,150,0,162,159,0,144,147,0,129,135,0,138,132,0,0,0,2049,0,0,4,0,0,514,0,0,2305,153,
141,0,165,171,0,180,168,0,177,174,0,183,186,0,0,0,2561,0,0,3329,0,0,6,0,0,259,0,0,5,0,0,770,
0,0,2817,0,0,3073,228,225,0,201,210,0,219,213,0,234,222,0,216,231,0,207,192,0,204,189,0,198,
195,0,243,261,0,273,240,0,246,237,0,249,258,0,279,276,0,252,255,0,270,282,0,264,267,0,0,0,51
5,0,0,260,0,0,7,0,0,1026,0,0,1282,0,0,4097,0,0,3841,0,0,3585,315,321,0,333,342,0,312,291,0,3
75,357,0,288,294,0,-1,369,0,285,303,0,318,363,0,297,306,0,339,309,0,336,348,0,330,300,0,372,
345,0,351,366,0,327,354,0,360,324,0,381,408,0,417,420,0,390,378,0,435,438,0,384,387,0,0,0,20
50,396,402,0,465,462,0,0,0,8,411,399,0,429,432,0,453,414,0,426,423,0,0,0,10,0,0,9,0,0,11,0,0
,5377,0,0,1538,0,0,771,0,0,5121,0,0,1794,0,0,4353,0,0,4609,0,0,4865,444,456,0,0,0,1027,459,4
50,0,0,0,261,393,405,0,0,0,516,447,441,0,516,519,0,486,474,0,510,483,0,504,498,0,471,537,0,5
07,501,0,522,513,0,534,531,0,468,477,0,492,495,0,549,546,0,525,528,0,0,0,263,0,0,2562,0,0,23
06,0,0,5633,0,0,5889,0,0,6401,0,0,6145,0,0,1283,0,0,772,0,0,13,0,0,12,0,0,14,0,0,15,0,0,517,
0,0,6657,0,0,262,540,543,0,480,489,0,588,597,0,0,0,27,609,555,0,606,603,0,0,0,19,0,0,22,591,
621,0,0,0,18,573,576,0,564,570,0,0,0,20,552,582,0,0,0,21,558,579,0,0,0,23,612,594,0,0,0,25,0
,0,24,600,615,0,0,0,31,0,0,30,0,0,28,0,0,29,0,0,26,0,0,17,0,0,16,567,618,0,561,585,0,654,633
,0,0,0,37,645,648,0,0,0,36,630,636,0,0,0,34,639,627,0,663,666,0,657,624,0,651,642,0,669,660,
0,0,0,35,0,0,267,0,0,40,0,0,268,0,0,266,0,0,32,0,0,264,0,0,265,0,0,38,0,0,269,0,0,270,0,0,33
,0,0,39,0,0,7937,0,0,6913,0,0,7681,0,0,4098,0,0,7425,0,0,7169,0,0,271,0,0,274,0,0,273,0,0,27
2,0,0,1539,0,0,2818,0,0,3586,0,0,3330,0,0,3074,0,0,3842]),w=1,g=2,C=3,v=179,T=1,x=175,F=0,k=
181,P=178,S=["precision mediump float;","uniform sampler2D YTexture;","uniform sampler2D CBTexture;","uniform sampler2D CRTexture;","varying vec2 texCoord;","void main() {","float y = texture2D(YTexture, texCoord).r;","float cr = texture2D(CBTexture, texCoord).r -0.5;","float cb = texture2D(CRTexture, texCoord).r - 0.5;","gl_FragColor = vec4(","y + 1.4 * cr,","y + -0.343 * cb - 0.711 * cr,","y + 1.765 * cb,","1.0",");","}"].join("\n"),A= ["precision mediump float;","uniform float loaded;","varying vec2 texCoord;","void main() {","float c = ceil(loaded-(1.0-texCoord.y));","gl_FragColor = vec4(c,c,c,1);","}"].join("\n"),B=["attribute vec2 vertex;","varying vec2 texCoord;","void main() {","texCoord = vertex;","gl_Position = vec4((vertex * 2.0 - 1.0) * vec2(1, -1), 0.0, 1.0);","}"].join("\n"),D=[null,c,f,u],R=function(t){
this.bytes=new
Uint8Array(t),this.length=this.bytes.length,this.writePos=this.bytes.length,this.index=0};R.
NOT_FOUND=-1,R.prototype.findNextMPEGStartCode=function(){for(var
t=this.index+7>>3;t<this.writePos;t++)if(0===this.bytes[t]&&0===this.bytes[t+1]&&1===this.by
tes[t+2])return this.index=t+4<<3,this.bytes[t+3];return
this.index=this.writePos<<3,R.NOT_FOUND},R.prototype.nextBytesAreStartCode=function(){var
t=this.index+7>>3;returnt>=this.writePos||0===this.bytes[t]&&0===this.bytes[t+1]&&1===this.bytes[t+2]},R.prototype.n
extBits=function(t){var e=this.index>>3,r=8-this.index%8;if(r>=t)return this.bytes[e]>>r-
t&255>>8-t;var i=(this.index+t)%8,o=this.index+t-1>>3,s=this.bytes[e]&255>>8-
r;for(e++;e<o;e++)s<<=8,s|=this.bytes[e];return i>0?(s<<=i,s|=this.bytes[e]>>8-i):
(s<<=8,s|=this.bytes[e]),s},R.prototype.getBits=function(t){var e=this.nextBits(t);return
this.index+=t,e},R.prototype.advance=function(t){return
this.index+=t},R.prototype.rewind=function(t){return this.index-=t}}(window);
//# sourceMappingURL=jsmpg.min.js.map