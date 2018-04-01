import atexit
import logging
import os
import subprocess

from .streamable_output import StreamableOutput

class StreamOutput(StreamableOutput):
    def __init__(self, config, output_name, camera_name):
        self.logger = logging.getLogger(__name__)
        
        self.config = config
        self.output_name = output_name
        self.camera_name = camera_name

        self.args = [
            "-f", "mpeg1video",
            "-an",
            "-b:v", "100k",
            "-r", "24",
        ]
        self.args.extend([
            "-vf", "scale=%d:%d" % (self.config['image_width'],
                self.config['image_height'])
        ])

        self.output_path = os.sep.join(["fifo", camera_name, output_name])
        subprocess.run(['mkdir', '-p', os.path.dirname(self.output_path)])
        try:
            os.mkfifo(self.output_path)
        except Exception as e:
            # They don't seem to get cleaned up properly usually, so we're just
            # going to ignore errors.
            # TODO: Probably come up with better handling here
            pass

        atexit.register(lambda: os.unlink(self.output_path)) # Clean up!

        self.args.extend([
            self.output_path
        ])


    def __str__(self):
        return self.camera_name + "/" + self.output_name


    def get_args(self):
        return self.args


    def get_output_path(self):
        return self.output_path
