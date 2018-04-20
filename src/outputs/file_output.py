import os
import subprocess

class FileOutput(object):
    def __init__(self, config, output_name, camera_name):
        self.config = config
        self.args = [
            "-f", "segment",
            "-an",
            "-pix_fmt", "yuv420p",
            "-preset:v", "ultrafast",
            "-segment_format", "mkv",
            "-segment_time", "900",
            "-segment_atclocktime", "1",
        ]
        self.log_folder = os.path.join(self.config['log_dir'], camera_name,
                output_name)
        self.args.extend([
            "-strftime", "1", 
            os.path.join(self.log_folder, "%Y-%m-%d_%H-%M-%S.mkv")
            #  "{0}/%Y-%m-%d_%H-%M-%S.mkv".format(self.config['log_dir'])
        ])

        subprocess.run(['mkdir', '-p', self.log_folder])


    def get_args(self):
        return self.args
