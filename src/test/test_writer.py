import time
import sys
import datetime

# start = time.time()
while True:
    print("Hello world, at: %s" % time.time())
    sys.stdout.flush()
    time.sleep(1)

    # if time.time() - start > 3:
        # break
