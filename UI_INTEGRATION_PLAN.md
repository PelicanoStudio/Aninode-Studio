# **PHASE 6: UI SYSTEM INTEGRATION & ADVANCED WORKFLOWS**

**GOAL:** Migrate the "Aninode Design System" into the Engine, connect it to the Store, and implement the advanced workflow features (Timeline, Picker, Importer).

## **STEP 1: MIGRATION & CLEANUP**

* **Action:** Copy quick\_reference/aninode-design-system/src/components to src/components/aninode-ui.  
* **Action:** Copy quick\_reference/aninode-design-system/src/hooks and utils to src/hooks and src/utils (resolve conflicts).  
* **Dependency:** Ensure lucide-react is installed.

## **STEP 2: THE GRAPH ORCHESTRATOR (NodeGraph.tsx)**

**Reference Source:** quick\_reference/aninode-design-system/App.tsx (Contains all the interaction logic).

* **Create:** src/pages/NodeGraph.tsx  
* **Logic Porting:**  
  1. **Rendering:** Map engineStore.project.nodes \-\> \<BaseNode\>.  
  2. **Selection:** Port the selection logic (Shift+Click, Drag Box).  
  3. **Shortcuts:** Port the useEffect handling Shift+Tab, Ctrl+C/V, Delete.  
  4. **Wiring:** Port handlePortDown, handlePortUp, and tempWire logic.  
     * *Crucial:* Implement the "Contextual Add" (Double click port \-\> Open Picker).  
  5. **Cloning:** Port handleNodeMouseDown logic for Alt+Drag cloning.

## **STEP 3: THE TIMELINE TRANSPLANT**

**Reference Source:** quick\_reference/AudioTimeline.tsx (This is the "Gold Standard" for timeline interaction).

* **Target:** src/components/Timeline/index.tsx  
* **Action:** Rewrite the component using the logic from AudioTimeline.tsx but adapted to engineStore.  
* **Features to Port:**  
  * Canvas-based ruler and waveform rendering.  
  * ClipComponent logic (dragging, trimming edges).  
  * Zoom logic (pixelsPerSecond).  
  * **Adaptation:** Instead of managing local clips state, read/write to engineStore.project.timeline.tracks.

## **STEP 4: NODE FACTORY & PICKER**

* **Node Picker:** Port NodePicker.tsx. Ensure the "Multi-Add" with counter badges works.  
* **Node Factory:** Create a mapping component that renders the correct UI content inside BaseNode based on node.type.  
  * *Example:* RotationNode \-\> \<Input label="Angle" ... /\>  
  * *Example:* LFONode \-\> \<Visualizer ... /\>

## **STEP 5: THE "PICKER NODE" LOGIC**

* **Create:** src/nodes/ObjectPickerNode/index.tsx  
* **UI:** Use \<BaseNode\> containing a custom dropdown/search.  
* **Logic:**  
  * Read engineStore.project.assets and engineStore.project.nodes.  
  * Output: { targetId: selectedId }.  
  * **Visuals:** If an asset is selected, show a thumbnail image in the node body.

## **EXECUTION ORDER FOR AI**

1. **"Migrate UI Assets":** Move components/hooks from quick\_reference to src/.  
2. **"Create NodeGraph":** Build the main canvas, porting interactions from App.tsx one by one (Pan/Zoom \-\> Selection \-\> Wiring).  
3. **"Implement Timeline":** Port AudioTimeline.tsx logic to src/components/Timeline.  
4. **"Connect Nodes":** Update RotationNode, LFONode etc. to render their UI using the new system.