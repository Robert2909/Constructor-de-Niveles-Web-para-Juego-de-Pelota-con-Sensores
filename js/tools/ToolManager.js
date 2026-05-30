export class ToolManager {
    constructor() {
        this.currentTool = null;
        this.tools = {};
    }
    
    registerTool(name, tool) {
        this.tools[name] = tool;
    }
    
    setTool(name) {
        if(this.tools[name]) {
            this.currentTool = this.tools[name];
        }
    }
    
    handleMouseDown(e, coords) { if(this.currentTool) this.currentTool.onMouseDown(e, coords); }
    handleMouseMove(e, coords) { if(this.currentTool) this.currentTool.onMouseMove(e, coords); }
    handleMouseUp(e, coords) { if(this.currentTool) this.currentTool.onMouseUp(e, coords); }
}
