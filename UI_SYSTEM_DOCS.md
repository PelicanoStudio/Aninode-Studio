# **ANINODE DESIGN SYSTEM (ADS) \- API & BEHAVIOR REFERENCE**

CONTEXT FOR AI:  
This project uses a custom, proprietary Node Graph UI library called "Aninode Design System" (ADS).  
The source code is located in quick\_reference/aninode-design-system/.  
CRITICAL: Do not invent UI logic. Port the existing interaction patterns from quick\_reference/aninode-design-system/App.tsx.

## **1\. Core Interactions & Shortcuts**

The NodeGraph orchestrator must implement these specific behaviors found in the reference App.tsx:

### **Wiring & Nodes**

* **Port-to-Port:** Drag from Input/Output to connect.  
* **Hot Wire:** Shift+Click on a port starts a wire that follows the mouse.  
* **Contextual Add:** Double-click on an **Input** or **Output** port opens the Node Picker filtered by compatibility (e.g., Output click \-\> shows only nodes with Inputs).  
* **Quick Clone:** Alt \+ Drag a Node copies it.  
* **Branch Clone:** Alt \+ Drag from an **Output Port** creates a clone of the source node automatically connected.  
* **Chain Copy:** Ctrl+C / Ctrl+V. If multiple connected nodes are selected, preserve connections in the paste.

### **Navigation & Selection**

* **Node Picker:** Shift \+ Tab opens the menu.  
  * *Multi-Add:* Shift \+ Click on items adds to a "queue" (shows counter badge). Clicking "Add Selected" instantiates all of them.  
* **Multi-Select:** Shift \+ Click or Drag Selection Box.

## **2\. Data Marshalling (The "Telepathy" Protocol)**

When connecting nodes or "teleporting" values (right-click bind), the system automatically converts types:

* **Boolean to Number:** true \-\> 1, false \-\> 0\.  
* **Boolean to Percentage:** If the target is a Slider (0-100) or Scale, true \-\> 100, false \-\> 0\.  
* **Normalized to Percentage:** 0.5 \-\> 50 (if target expects percentage).

## **3\. The Timeline System (Reference: AudioTimeline.tsx)**

The Timeline implementation is complex. Refer strictly to quick\_reference/AudioTimeline.tsx for:

* **Visuals:** Ruler rendering, Grid subdivision on zoom.  
* **Interactions:** Scrubbing, Clip trimming (edge drag), Clip dragging.  
* **Tracks:** Rendering audio waveforms (canvas) and keyframe dots.  
* **Controls:** Play/Pause (Spacebar), Zoom (Wheel), Vertical Scroll (Alt+Wheel).

## **4\. Component Reference**

### **BaseNode.tsx**

The shell for all nodes. Handles selection visual state (border glow) and port rendering.

### **NodePicker.tsx**

The modal for adding nodes. Contains the logic for the "Badge Counter" multi-add feature.

### **ConnectionLine.tsx**

Handles the drawing of Bezier, Straight (Telepathic), and Step cables.

## **5\. Implementation Pattern**

When porting App.tsx to NodeGraph.tsx:

1. Replace local useState for nodes/connections with engineStore actions.  
2. Keep local useState for transient UI interactions (drag start, temp wire, selection rectangle).  
3. Use useNodeRegistration inside the node components to sync props back to the store.