import multiprocessing

def hello(name):
    print("Hello world", name)

p1 = multiprocessing.Process(target=hello, args=("123",))
p1.start()
p1.join()
