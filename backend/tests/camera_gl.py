import cv2
import sys
from OpenGL.GL import *
from OpenGL.GLUT import *
from OpenGL.GLU import *
import numpy as np

class CameraGLApp:
    def __init__(self):
        self.camera = None
        self.window = None
        self.width = 800
        self.height = 600
        
        # Check GLUT availability
        if not bool(glutInit):
            raise ImportError("GLUT initialization failed - glutInit not available")

    def init_camera(self):
        """Initialize webcam capture"""
        self.camera = cv2.VideoCapture(0)
        if not self.camera.isOpened():
            raise Exception("Could not open camera")
        self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        print("Camera initialized successfully")

    def init_gl(self):
        """Initialize OpenGL"""
        # Initialize GLUT with proper arguments
        if not sys.argv:
            sys.argv = [b""]  # Provide default argument if none exists
            
        glutInit(sys.argv)
        glutInitDisplayMode(GLUT_RGBA | GLUT_DOUBLE | GLUT_DEPTH)
        glutInitWindowSize(self.width, self.height)
        glutInitWindowPosition(100, 100)
        
        # Create window and check if successful
        self.window = glutCreateWindow(b"Camera GL")
        if not self.window:
            raise Exception("Failed to create GLUT window")
        
        # GL setup
        glClearColor(0.0, 0.0, 0.0, 0.0)
        glEnable(GL_DEPTH_TEST)
        glMatrixMode(GL_PROJECTION)
        glLoadIdentity()
        gluPerspective(45, (self.width/self.height), 0.1, 50.0)
        
        # Register callbacks
        glutDisplayFunc(self.display)
        glutKeyboardFunc(self.keyboard)
        
        print("OpenGL initialized successfully")

    def display(self):
        """GLUT display callback"""
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        glMatrixMode(GL_MODELVIEW)
        glLoadIdentity()
        
        if self.camera:
            ret, frame = self.camera.read()
            if ret:
                # Flip the frame horizontally
                frame = cv2.flip(frame, 1)
                # Display the camera feed in an OpenCV window for debugging
                cv2.imshow('Camera Feed', frame)
        
        glutSwapBuffers()
        glutPostRedisplay()

    def keyboard(self, key, x, y):
        """Handle keyboard input"""
        if key == b'\x1b':  # ESC key
            if self.camera:
                self.camera.release()
            cv2.destroyAllWindows()
            glutLeaveMainLoop()

    def run(self):
        """Main application loop"""
        try:
            self.init_camera()
            self.init_gl()
            glutDisplayFunc(self.display)
            glutKeyboardFunc(self.keyboard)
            print("Starting GLUT main loop")
            glutMainLoop()
        except Exception as e:
            print(f"Error: {e}")
        finally:
            if self.camera:
                self.camera.release()
            cv2.destroyAllWindows()
            if self.window:
                glutDestroyWindow(self.window)

if __name__ == "__main__":
    try:
        # Check OpenGL/GLUT availability before creating app
        if not bool(glutInit):
            raise ImportError("OpenGL/GLUT not properly installed")
            
        app = CameraGLApp()
        app.run()
    except Exception as e:
        print(f"Application error: {e}")
        sys.exit(1)