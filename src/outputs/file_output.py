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
        self.args.extend([
            "-strftime", "1", 
            "{0}/%Y-%m-%d_%H-%M-%S.mkv".format(self.config['log_dir'])
        ])


    def get_args(self):
        return self.args
