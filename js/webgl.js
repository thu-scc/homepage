// ============ WebGL Dual Background ============
(function() {
  const VS = 'attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}';

  const FS_DARK = `precision highp float;
uniform vec2 u_resolution;uniform float u_time;uniform vec2 u_mouse;
vec3 palette(float t,vec3 a,vec3 b,vec3 c,vec3 d){return a+b*cos(6.28318*(c*t+d));}
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  vec2 p=uv*2.0-1.0;p.x*=u_resolution.x/u_resolution.y;
  vec2 m=u_mouse*2.0-1.0;m.x*=u_resolution.x/u_resolution.y;
  float md=length(p-m);
  float mr=sin(md*12.0-u_time*3.0)*exp(-md*3.5)*0.06;
  p+=normalize(p-m+vec2(0.001))*mr;
  for(float i=1.0;i<4.0;i++){
    p.x+=0.08/i*sin(i*3.0*p.y+u_time*0.35)+0.03;
    p.y+=0.08/i*cos(i*2.5*p.x+u_time*0.28)-0.03;
  }
  float r=length(p);float ang=atan(p.y,p.x);
  vec3 a=vec3(0.04,0.06,0.12);
  vec3 b=vec3(0.03,0.04,0.06);
  vec3 c=vec3(1.0,1.0,1.0);
  vec3 d=vec3(0.15,0.25,0.45);
  vec3 col=palette(r*1.2+u_time*0.08,a,b,c,d);
  float disp=sin(r*20.0-u_time*1.2+ang*2.0)*0.5+0.5;
  col+=vec3(disp*0.008,disp*0.012,disp*0.025);
  float hi=pow(sin(p.x*3.0+p.y*2.5+u_time*0.6)*0.5+0.5,10.0);
  col+=hi*vec3(0.02,0.03,0.06);
  vec3 base=vec3(0.035,0.06,0.12);
  col=mix(base,col,0.9);
  gl_FragColor=vec4(col,1.0);
}`;

  const FS_LIGHT = `precision highp float;
uniform vec2 u_resolution;uniform float u_time;uniform vec2 u_mouse;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  float a=hash(i),b=hash(i+vec2(1,0));
  float c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v=0.0,a=0.5;
  mat2 m=mat2(0.80,0.60,-0.60,0.80);
  for(int i=0;i<5;i++){v+=a*noise(p);p=m*p*2.02;a*=0.5;}
  return v;
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  vec2 p=uv;p.x*=u_resolution.x/u_resolution.y;
  vec2 m=u_mouse;m.x*=u_resolution.x/u_resolution.y;
  vec2 md=p-m;float dl=length(md);
  p+=normalize(md+vec2(0.0001))*exp(-dl*5.0)*0.03;
  vec2 q=vec2(fbm(p*1.8+u_time*0.07),fbm(p*1.8+vec2(5.2,1.3)+u_time*0.06));
  vec2 r=vec2(fbm(p*2.0+q*1.3+vec2(1.7,9.2)+u_time*0.05),
              fbm(p*2.0+q*1.3+vec2(8.3,2.8)+u_time*0.04));
  float f=fbm(p*2.2+r*1.5);
  vec3 silverDark=vec3(0.86,0.85,0.84);
  vec3 paper=vec3(0.955,0.945,0.935);
  vec3 col=mix(silverDark,paper,f);
  float ph=r.x*2.2+u_time*0.35;
  col+=vec3(0.78,0.62,0.92)*sin(ph)*0.04;
  col+=vec3(0.55,0.72,0.95)*sin(ph*0.8+2.0)*0.035;
  float hl=smoothstep(0.48,0.92,f);
  col+=hl*0.05;
  gl_FragColor=vec4(col,1.0);
}`;

  let mouse = {x:0.5, y:0.5};
  document.addEventListener('mousemove', e => { mouse.x=e.clientX/innerWidth; mouse.y=e.clientY/innerHeight; });

  function bootGL(canvasId, fsSrc) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return ()=>{};
    const gl = canvas.getContext('webgl', {alpha:false, antialias:false});
    if (!gl) return ()=>{};
    function mk(t,s){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh;}
    const prog=gl.createProgram();
    gl.attachShader(prog,mk(gl.VERTEX_SHADER,VS));
    gl.attachShader(prog,mk(gl.FRAGMENT_SHADER,fsSrc));
    gl.linkProgram(prog);gl.useProgram(prog);
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(prog,'position');
    gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const lRes=gl.getUniformLocation(prog,'u_resolution');
    const lT=gl.getUniformLocation(prog,'u_time');
    const lM=gl.getUniformLocation(prog,'u_mouse');
    function resize(){const d=Math.min(devicePixelRatio||1,1.5);canvas.width=innerWidth*d;canvas.height=innerHeight*d;gl.viewport(0,0,canvas.width,canvas.height);}
    window.addEventListener('resize',resize);resize();
    return (tSec)=>{gl.uniform2f(lRes,canvas.width,canvas.height);gl.uniform1f(lT,tSec);gl.uniform2f(lM,mouse.x,1.0-mouse.y);gl.drawArrays(gl.TRIANGLES,0,6);};
  }

  const drawDark = bootGL('bg-dark', FS_DARK);
  const drawLight = bootGL('bg-light', FS_LIGHT);
  const t0 = Date.now();
  (function loop(){
    const t = (Date.now()-t0)/1000;
    drawDark(t);
    drawLight(t);
    requestAnimationFrame(loop);
  })();
})();
