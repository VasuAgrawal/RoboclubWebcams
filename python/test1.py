import pdb
import cv2
import subprocess as sp
import numpy

command = [ 'ffmpeg',
            # '-i', '../nosound.mkv',
            '-i', '/dev/video0',
            '-f', 'image2pipe',
            '-pix_fmt', 'bgr24',
            '-vcodec', 'rawvideo', '-']
pipe = sp.Popen(command, stdout = sp.PIPE, bufsize=10**7)

image_size = (360, 640)

while True: 

    raw_image = pipe.stdout.read(image_size[0] * image_size[1] *3)
    # transform the byte read into a numpy array
    image =  numpy.fromstring(raw_image, dtype='uint8')
    image = image.reshape((*image_size, 3))

    # Send out image to clients
    cv2.imshow("name", image)
    k = cv2.waitKey(1)
    if k & 0xFF == ord('q'):
        break
