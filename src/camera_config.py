import logging
import yaml

# TODO: Figure out a way of doing this dynamically?
from inputs.file_input import FileInput
from inputs.rtsp_input import RtspInput
from inputs.webcam_input import WebcamInput
from outputs.file_output import FileOutput
from outputs.stream_output import StreamOutput

class CameraConfig(object):
    
    def __init__(self, path):
        """Load the camera yaml_configuration from disk.

        Camera yaml_configuration file must be a valid YAML file. The configuration
        file is loaded and various different iput and output objects are
        constructed from the yaml_configuration.

        Args:
            path: path to a valid YAML camera yaml_configuration file.
        """
        # TODO: Any sort of verification or error checking of configs.
        # Set up logging.
        self.logger = logging.getLogger(__name__)

        # Load the raw yaml yaml_config.
        with open(path, 'r') as f:
            yaml_config = yaml.load(f.read())

        self.camera_name = yaml_config['name']

        # Apparently, this is the correct way of doing a dynamic lookup of the
        # correct class to call based on the string specified in the camera
        # config file. This code looks up the class and constructs the input.
        input_class_name = yaml_config['input']['class']
        self.logger.debug("Creating input object of type %s.", input_class_name)
        input_class = globals()[input_class_name] # The actual class
        self.input_obj = input_class(yaml_config['input'], self.camera_name)

        # Do the same thing as above, except for each of the outputs present in
        # the configuration file.
        self.output_objs = []
        for output_name in yaml_config['outputs']:
            output_yaml_config = yaml_config['outputs'][output_name]
            output_type = globals()[output_yaml_config['class']]
            output_obj = output_type(output_yaml_config, output_name, 
                    self.camera_name)
            self.output_objs.append(output_obj)

        self.ffmpeg_command = [
                "ffmpeg",
                "-hide_banner",
                "-loglevel", "warning",
                "-y",
        ]


    def __str__(self):
        """Get string representation of this configuration.

        Returns:
            space joined version of get_command().
        """
        return " ".join(self.get_command()) 


    def get_command(self):
        """Return the complete ffmpeg command specified by this config.

        This ffmpeg command will spawn ffmpeg with the input and all of the
        outputs specified by its sub-objects.

        Returns:
            list of strings of ffmpeg commands, to be passed into a subprocess
            call.
        """
        command = [] + self.ffmpeg_command
        command.extend(self.input_obj.get_args())
        for output_obj in self.output_objs:
            command.extend(output_obj.get_args())

        return command
