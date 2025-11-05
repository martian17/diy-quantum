# Rendering Pipeline
The webgl canvas switches between face, edge, and label drawer to add respective components to the screen buffer. With the utilization of depth buffers, the drawing order is preserved.  
Each `Drawer` class stores the gl context as the internal state, and manages its own VAO, VBO, and linked and compiled shader program. The parent class switches between these `Drawer` classes to achieve the desired output. 

## Face drawer class
This class manages the face states. It stores two buffers, `vertexBuffer` as `gl.ARRAY_BUFFER`, which also contains the phase information, and `faceBuffer` as `gl.ELEMENT_ARRAY_BUFFER`.  
This drawer outputs faces with gradient depending on phase and modulus of the density matrix.
