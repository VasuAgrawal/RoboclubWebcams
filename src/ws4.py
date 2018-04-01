#!/usr/bin/env python3.6
import argparse
import asyncio
import logging
import logging.config
import multiprocessing
import os
import time
import yaml

from camera_config import CameraConfig
from camera_server import CameraServer

parser = argparse.ArgumentParser(description="""\
Program to stream webcams to the masses.

This program launches a number of servers (1 per process) to stream camera data
to clients using websockets. Cameras can be configured via YAML. Many cameras
and multiple outputs per camera can be handled by a single process, though it is
not recommended. FFMPEG is used to stream and transcode.

Python 3.6 is required. It's time.
""", formatter_class=argparse.RawTextHelpFormatter)
parser.add_argument(
    '-p', '--processes',
    type=int,
    default=1,
    help='Number of processes to start to handle cameras.'
)
parser.add_argument(
    'files',
    type=argparse.FileType('r'),
    nargs='+',
    help='Camera description filename(s)'
)
args = parser.parse_args()


def configure_logging(config_path, log_dir):
    """Load logging configuration from disk and use that to configure logging.

    Default logging configuration will log to standard error, as well as logging
    to disk on a rotating basis to avoid files getting too big.
    """

    # Load the logger. If the file doesn't exist, an error will just be thrown.
    log_config = yaml.load(open(config_path).read())

    # Configure the logging directory for the rotating files. There is probably
    # a better way to configure this.
    log_dir = os.path.abspath(log_dir) # To handle relative-ness
    log_name = time.strftime("%Y-%m-%d_%H-%M-%S.log", time.gmtime())
    log_path = os.path.join(log_dir, log_name)
    log_config['handlers']['disk']['filename'] = log_path

    # Make the logging directory. Any exceptions here are probably important.
    os.makedirs(log_dir, exist_ok=True)

    # Actually load the configuration into the logging module. Remember that
    # this logging configuration applies for all modules in the project, not
    # just this one.
    logging.config.dictConfig(log_config)

    logger = logging.getLogger(__name__)
    logger.info("Successfully configured logging to %s.", log_path)


def assign_cameras_to_processes(filenames, num_processes):
    """Split filenames among number of processes.

    Args:
        filenames: list of files containing camera specifications.
        num_processes: number of processes to split amongst. Must be >= 1.

    Returns:
        List of size num_processes containing assignments of filenames.
    """
    assignments = [[] for i in range(num_processes)]
    for i, name in enumerate(filenames):
        assignments[i % num_processes].append(name)

    return assignments


def run_camera_process(assignment, process_number):
    """Function to run a single camera process.

    This function receives an assignment and starts a separate camera server for
    each of the camera configurations in the assignment. Ideally, there is only
    a single camera stream being handled (per process), but this function is
    built to support multiple in case things become more efficient.

    This function should not return under normal operation, since a
    loop.run_forever() is called at the end (to start the asyncio loop).

    Args:
        assignment: list of camera configuration files to stream.
    """
    logger = logging.getLogger(__name__)
    loop = asyncio.get_event_loop()

    for i, camera_config_file_name in enumerate(assignment):
        logger.debug("Starting server %d in process %d.", i, process_number)

        # Load camera configuration into an object.
        camera_config = CameraConfig(camera_config_file_name)

        # Start server based on camera configuration.
        camera_server = CameraServer(camera_config)
        loop.run_until_complete(camera_server.create_ffmpeg_process())
        loop.run_until_complete(camera_server.init_stream_servers())

    loop.set_debug(True) # Enable better debugging output.
    loop.run_forever() # Spin forever serving things.


def start_camera_processes(assignments):
    """Start an individual process to handle each of the assignmnts.

    Args:
        assignments: list of list of assginments for processes.

    Returns:
        list of multiprocessing.Process objects started.
    """
    logger = logging.getLogger(__name__)

    processes = []
    for i, assignment in enumerate(assignments):
        logger.debug("Forking process %d from main process.", i)
        process = multiprocessing.Process(
            target=run_camera_process,
            args=(assignment, i)
        )
        process.start()
        processes.append(process)

    return processes


def main():
    # Set up logging infrastructure.
    configure_logging('logging.yaml', log_dir="../server_logs")
    logger = logging.getLogger(__name__)

    # Split work between specified number of processes.
    filenames = map(lambda x: x.name, args.files)
    assignments = assign_cameras_to_processes(filenames, args.processes)
    logger.debug("Generated assignments %s to %d processes.", assignments,
                 args.processes)

    # Start processes based on the assignments.
    processes = start_camera_processes(assignments)

    # Have the main process wait for all child processes to terminate.
    # TODO: Consider having this spin in a loop and join periodically?
    for i, process in enumerate(processes):
        logger.debug("Waiting on process %d.", i)
        process.join()
        logger.info("Process %d exited with exit code %d.", i,
                    process.exitcode)


if __name__ == "__main__":
    main()
