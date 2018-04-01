class RtspInput(object):
    def __init__(self, config, camera_name):
        self.config = config
        self.args = [
            "-rtsp_transport", "tcp",
            "-allowed_media_types", "video",
            "-r", "25",
        ]
        self.args.extend([
            "-i",
            self.config['rtsp_addr']
        ]) 


    def get_args(self):
        return self.args
