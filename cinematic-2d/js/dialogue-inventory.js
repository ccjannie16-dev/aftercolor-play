"use strict";

/* Machine-readable inventory of every dialogue-producing route family. The
   browser audit runs each entry through the real controller and visible DOM;
   it is intentionally separate from player-route ending acceptance. */

window.AftercolorDialogueInventory = (() => {
  const entries = [];
  const add = (id, category, lines, mode = "story") => {
    const normalized = (Array.isArray(lines) ? lines : [lines]).filter((line) => line && (line.text || line.line || line.choices || line.echo));
    if (normalized.length) entries.push({ id, category, mode, lines:normalized });
  };
  const { SCENES, HOTSPOT_DIALOGUE, BIBO_INTRO } = window.AftercolorScenes;

  Object.values(SCENES).forEach((scene) => {
    add(`scene:first-visit:${scene.id}`, "first-visit", scene.entryDialogue || []);
    [...(scene.hotspots || []),...(scene.exits || [])].forEach((route) => {
      if (route.gatedLine) add(`gated:${scene.id}:${route.id}`, "gated-hotspot", [{speaker:/^BIBO:/i.test(route.gatedLine)?"Bibo":"Anna",text:route.gatedLine.replace(/^(ANNA|BIBO):\s*/i,"")}]);
      if (route.guidanceLine) add(`idle:${scene.id}:${route.id}`, "idle-guidance", [{speaker:/^BIBO:/i.test(route.guidanceLine)?"Bibo":"Anna",text:route.guidanceLine.replace(/^(ANNA|BIBO):\s*/i,"")}]);
    });
  });
  Object.entries(HOTSPOT_DIALOGUE).forEach(([key, lines]) => add(`hotspot:${key}`, /Aftermath|maintenanceNote|cookingAftermath/i.test(key)?"minigame-completion":"object-inspection", lines));
  add("entry:bibo-introduction","bibo-introduction",BIBO_INTRO);

  const choices = {
    "choice:door":[{speaker:"Anna",text:"…",choices:[{label:"OPEN THE DOOR",id:"open_door"},{label:"WALK AWAY",id:"walk_away"}]}],
    "choice:stay":[{speaker:"Anna",text:"…",choices:[{label:"SHOW ME.",id:"show_me"},{label:"I’M ONLY HERE FOR THE PAPERWORK.",id:"paperwork"}]}],
    "choice:optional-minigame":[{speaker:"Bibo",text:"Would you like to play?",choices:[{label:"PLAY ONE GAME.",id:"play"},{label:"NOT RIGHT NOW.",id:"decline"}]}],
    "choice:need-a-moment":[{speaker:"Anna",text:"…",choices:[{label:"I’M READY.",id:"ready"},{label:"I NEED A MOMENT.",id:"moment"}]}],
    "choice:final":[{speaker:"Anna",text:"…",choices:[{label:"Everything she prepared arrived. The parts. The cat. Someone.",id:"confirm"},{label:"I’ll come back.",id:"return"},{label:"[Say nothing.]",id:"silence"}]}]
  };
  Object.entries(choices).forEach(([id,lines])=>add(id,"mandatory-choice",lines));
  add("echo:need-a-moment","echo",[{speaker:"Abby Echo",text:"Bibo, it’s okay. Take your time.",echo:"take_time"}]);
  add("echo:remote-loop","echo",[{speaker:"Abby Echo",text:"Bibo, you hid the remote in the couch again, didn’t you?",echo:"remote"},{speaker:"Memory",text:"Bibo reaches between the cushions and removes the remote."}]);

  const bridgeLines = {
    "lr-sofa":["Anna","The sofa by the window is holding the shape of someone who used to sit there."],"lr-notebook":["Bibo","The blue notebook is behind the other books."],"lr-card-table":["Bibo","The cards have been waiting 352 days."],"lr-to-kitchen":["Bibo","The kitchen is through the doorway."],"kit-tablet":["Anna","The kitchen tablet is still open to a file without a path."],"kit-stove":["Anna","The recipe card is beside the stove. It still expects someone to begin."],"kit-to-living":["Bibo","There is another room past the living room."],"br-laptop":["Anna","The laptop beside the workbench still shows Abby’s order history."],"br-packages":["Bibo","The packages are for the parts on that order."],"br-envelope":["Anna","There is an envelope beneath the parts."],"br-cat-bed":["Anna","The cat bed is beside Bibo’s charging station."],"br-letter":["Bibo","There is a folded sheet in the bottom drawer."],"br-to-living":["Bibo","The balcony is last."],"lr-to-balcony":["Bibo","The balcony is last."],"bal-wait":["Anna","We can wait at the threshold. Quietly."]
  };
  Object.entries(bridgeLines).forEach(([id,[speaker,text]])=>add(`bridge:${id}`,"narrative-bridge",[{speaker,text}]));

  Object.entries(window.AftercolorEnding.ENDING_SCRIPTS).forEach(([id,script])=>add(`ending:${id}`,"ending-dialogue",script.beats));

  const legacy = window.AftercolorStoryData || {};
  ["scene5","scene6","scene7"].forEach((key)=>add(`flowchart:story:${key}`,"flowchart-replay",legacy[key]||[],"replay"));
  Object.entries(legacy.roomFirstEntry || {}).forEach(([key,lines])=>add(`flowchart:room:${key}`,"flowchart-replay",lines,"replay"));
  Object.entries(legacy.coreDialogue || {}).forEach(([key,value])=>{
    if(Array.isArray(value))add(`flowchart:choice:${key}`,"flowchart-replay",value,"replay");
    else { add(`flowchart:anchor:${key}`,"flowchart-replay",value?.lines||[],"replay");add(`gallery:memory:${key}`,"gallery-replay",value?.memoryLines||[],"replay"); }
  });

  async function runControllerAudit() {
    const results=[];
    const dialogue=window.AftercolorDialogue;
    for(const entry of entries){
      let completions=0,choices=0;
      dialogue.show(entry.lines,()=>{completions+=1;},()=>{choices+=1;},{routeId:entry.id});
      await new Promise(requestAnimationFrame);
      const panel=document.getElementById("dialogue-panel"),skip=panel.querySelector(".dialogue-skip");
      const before={panelVisible:panel.classList.contains("is-visible"),skipVisible:skip.classList.contains("is-visible")&&getComputedStyle(skip).pointerEvents!=="none",focusable:!skip.disabled&&skip.tabIndex>=0,accessibleName:skip.getAttribute("aria-label")||skip.textContent.trim()};
      skip.focus();skip.click();await new Promise((resolve)=>setTimeout(resolve,20));
      const choiceList=panel.querySelector(".choice-list");
      const hasMandatoryChoice=entry.lines.some((line)=>line.choices);
      const choiceSafe=!hasMandatoryChoice||!!choiceList;
      const autoChoiceCount=choices;
      if(choiceList)choiceList.querySelector("button")?.click();
      await new Promise((resolve)=>setTimeout(resolve,20));
      const callbackSafe=hasMandatoryChoice?(completions===0&&autoChoiceCount===0&&choices===1):(completions===1&&choices===0);
      results.push({id:entry.id,category:entry.category,...before,choiceSafe,autoChoiceCount,finalChoiceCount:choices,completionCount:completions,callbackSafe,residualEchoes:document.querySelectorAll(".echo-text").length,residualDialogue:dialogue.isVisible()});
      dialogue.hide();
    }
    return {total:entries.length,failures:results.filter((result)=>!result.panelVisible||!result.skipVisible||!result.focusable||!result.accessibleName||!result.choiceSafe||!result.callbackSafe||result.autoChoiceCount!==0||result.residualEchoes!==0||result.residualDialogue),results};
  }

  return { entries, categories:[...new Set(entries.map((entry)=>entry.category))], runControllerAudit };
})();
