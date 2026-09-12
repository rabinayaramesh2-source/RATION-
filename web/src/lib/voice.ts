export function speak(text:string, lang:"en-IN"|"ta-IN"="en-IN"){
  if(!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang=lang; u.rate=.9; u.pitch=1;
  window.speechSynthesis.speak(u);
}
