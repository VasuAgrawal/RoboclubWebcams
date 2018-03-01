import json
import os

import pdb
import pprint

def load_config(filename):
    with open(filename, 'r') as f:
        lines = ""
        for line in f.readlines():
            if not line.strip().startswith("#"): # Ignore "comments"
                lines += line

        # pdb.set_trace()
        loaded = json.loads(lines)

        # Dealing with imported paths, if any.
        working_path = os.path.dirname(filename)
        imports = loaded.pop("_imports", [])

        # Go through imports backwards in order to have the proper overwriting
        # behavior.
        for import_name in imports[::-1]:
            import_path = import_name # Relative
            if not import_path.startswith(os.sep): # Absolute
                # TODO: Windows?
                import_path = os.path.join(working_path, import_name) 

            # print("Importing from", import_path)
            imported = load_config(import_path)

            imported.update(loaded)
            loaded = imported

        return loaded


def _test():
    pprint.pprint(load_config("test/A.json"))
    pprint.pprint(load_config("test/B.json"))
    pprint.pprint(load_config("test/C.json"))


if __name__ == "__main__":
    _test()
