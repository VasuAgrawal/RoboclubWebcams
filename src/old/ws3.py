import asyncio
import argparse
import logging
import logging.handlers
import logging.config
import multiprocessing
import os
import subprocess
import sys
import time
import yaml

from camera_config import CameraConfig
from camera_stream import CameraStream
from camera_server import CameraServer

parser = argparse.ArgumentParser(
        allow_abbrev=True,
        description="""\
Program to stream webcams to the masses.

This program lauches a server to stream live webcam data over the internet. The
cameras are read via ffmpeg, with parameters specified in configuration files.
All cameras can either be handled in a single process, or each stream can be
allocated a separate process.

Python 3.6 is required.""")
parser.add_argument(
        'files', type=argparse.FileType('r'), nargs='+',
        help='Camera description file')
parser.add_argument(
        '-p', type=int, default=1,
        help='Number of processes to start to handle the streams.')
args = parser.parse_args()


def parse_camera_files(files):
    """Get set of unique filenames from files list.

    This also handles the distinction between .manifest files and .json files.
    """
    # TODO: Can this be tied directly into the parser?
    names = list(map(lambda x: x.name, files))
    logger = logging.getLogger(__name__)
    unique_streams = set()

    for name in names:
        if name.endswith('.manifest'):
            with open(name, 'r') as manifest:
                names.extend([line.strip() for line in manifest.readlines()])  
        elif name.endswith('.json'):
            unique_streams.add(name)
        else:
            logger.warning('Received file %s with invalid extension', f)
    
    return list(unique_streams)


# This is the function which runs in the new process
def stream_cameras(configs):
    """Do stuff

    Args:
        configs: A list of config filenames
    """
    camera_configs = map(CameraConfig, configs)
    servers = map(CameraServer, camera_configs)
    
    loop = asyncio.get_event_loop()
    loop.set_debug(True)

    for server in servers:
        loop.run_until_complete(server.init())

    loop.run_forever()


# Function which runs in the main process to start everything
def start_camera_streams(streams, num_processes):
    """Start the specified number of streams across the processes."""
    logger = logging.getLogger(__name__)
    num_processes = min(max(num_processes, 1), len(streams))
    logger.info("Starting %d streams amongst %d processes!", 
            len(streams), num_processes)

    assignments = [[] for i in range(num_processes)]
    for i, name in enumerate(streams):
        assignments[i % num_processes].append(name)

    processes = [multiprocessing.Process(target=stream_cameras,
        args=(assignment,)) for assignment in assignments]
    for process in processes:
        process.start()

    # Wait for all of the processes to do their work, indefinitely.
    for process in processes:
        process.join()


def configure_logging():
    # Load logging configuration from disk and use that.
    # Hack the logging to use a time-based filename.
    log_config = yaml.load(open('logging.yaml').read())
    log_dir = "logs"
    log_name = time.strftime("%Y-%m-%d_%H-%M-%S.log", time.gmtime())
    subprocess.run(['mkdir', '-p', log_dir]) # Make sure it exists
    log_path = os.path.join(log_dir, log_name)
    log_config['handlers']['disk']['filename'] = log_path
    logging.config.dictConfig(log_config)


def main():
    configure_logging()
    logger = logging.getLogger(__name__)

    # Figure out what streams to run, run those.
    start_camera_streams(list(map(lambda x: x.name, args.files)), args.p)
    return


if __name__ == "__main__":
    main()
