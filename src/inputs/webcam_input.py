class WebcamInput(object):
    def __init__(self, config, camera_name):
        self.config = config
        self.args = []
        self.args.extend([
            "-i",
            self.config['port']
        ]) 


    def get_args(self):
        return self.args
