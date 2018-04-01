class FileInput(object):
    def __init__(self, config, camera_name):
        self.config = config
        self.args = [
            "-re",
        ]
        self.args.extend([
            "-i", self.config['filename']
        ])

    def get_args(self):
        return self.args
