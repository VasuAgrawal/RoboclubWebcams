import asyncio
import argparse
import logging
import multiprocessing
import sys

from camera_stream import CameraStream

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
    unique_streams = set()

    for name in names:
        if name.endswith('.manifest'):
            with open(name, 'r') as manifest:
                names.extend([line.strip() for line in manifest.readlines()])  
        elif name.endswith('.json'):
            unique_streams.add(name)
        else:
            logging.warning('Received file %s with invalid extension', f)
    
    return list(unique_streams)


def stream_cameras(configs):
    loop = asyncio.get_event_loop()

    streams = map(CameraStream, configs)
    for stream in streams:
        loop.run_until_complete(stream.init_stream(loop))

    # And start serving finally.
    loop.set_debug(True)
    loop.run_forever()


def start_camera_streams(streams, num_processes):
    """Start the specified number of streams across the processes."""
    num_processes = min(max(num_processes, 1), len(streams))
    logging.info("Starting %d streams amongst %d processes!", 
            len(streams), num_processes)

    assignments = [[] for i in range(num_processes)]
    for i, name in enumerate(streams):
        assignments[i % num_processes].append(name)

    processes = [multiprocessing.Process(target=stream_cameras,
        args=(assignment,)) for assignment in assignments]
    for process in processes:
        process.start()

    for process in processes:
        process.join()


def main():
    print(args)
    logging.basicConfig(level=logging.INFO)
    streams = parse_camera_files(args.files)
    print(streams)

    start_camera_streams(streams, args.p)
    return


if __name__ == "__main__":
    main()
