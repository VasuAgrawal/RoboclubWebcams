class WebcamInput(object):
    def __init__(self, config, base_name):
        self.config = config
        self.args = []
        self.args.extend([
            "-i",
            self.config['port']
        ]) 


    def get_args(self):
        return self.args
