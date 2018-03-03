import json
import os
import re

import pdb
import pprint

def catchall(f):
    def g(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            print("Error in calling function", f.__name__,
                    "with arguments", args, kwargs, e)
    return g


@catchall
def _raw_load(filename):
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
            imported = _raw_load(import_path)

            imported.update(loaded)
            loaded = imported

        return loaded


# Given a string, fill it out with the appropriate keys if necessary.
def _render_string(s, d):
    r = re.compile(r"({%\s*\w+\s*%})")
    match = r.search(s)

    if match:
        command = match.group(0)
        key = command[2:-2].strip()
        replaced = s.replace(command, str(d[key]))

        # Intentionally throw an error if not found.
        return _render_string(replaced, d)

    return s


# Given a list, render strings inside of it, or recursively apply rendering to
# other lists and dictionaries contained inside.
def _render_list(l, d):
    for i, elem in enumerate(l):
        if type(elem) == str:
            l[i] = _render_string(elem, d)
        elif type(elem) == list:
            _render_list(elem, d) # Modifies in place
        elif type(elem) == dict: # This is possible too I guess.
            _render_dict(d)
     

# Given a dict, render strings inside of it, or recursively apply rendering to
# other lists and dictionaries contained inside.
def _render_dict(d):
    for key in d:
        val = d[key]
        if type(val) == str:
            d[key] = _render_string(val, d)
        elif type(val) == list:
            d[key] = _render_list(val, d)
            d[key] = list(map(
                lambda x: _render_string(x, d) if type(x) == str else x, val))
        elif type(val) == dict:
            d[key] = _render_dict(val)


def load_config(filename):
    # Is this basically a shitty version of Jinja?
    loaded = _raw_load(filename)
    _render_dict(loaded)
    return loaded


def _test():
    pprint.pprint(load_config("test/A.json"))
    pprint.pprint(load_config("test/B.json"))
    pprint.pprint(load_config("test/C.json"))


if __name__ == "__main__":
    _test()
