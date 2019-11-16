from itertools import groupby
from operator import itemgetter

def to_sessions(frames):
    sessions_raw = []
    for k, g in groupby(frames, lambda x: x['url']):
        sessions_raw.append(list(g))
    
    sessions = []
    for sample in sessions_raw:
        temp = {
            'type': sample[0]['type'],
            'from': sample[0]['timestamp'],
            'to': sample[-1]['timestamp'],
            'url': sample[0]['url'],
        }
        
        data = []
        for i in sample:
            data.extend(list(i['data'].values())[0])
        
        temp['data'] = {list(sample[0]['data'].keys())[0]: data}
        
        sessions.append(temp)
    return sessions


def get_basic_stats(sessions, from_, to_):
    interests = {}
    
    sessions = list(filter(lambda x: x['from'] >= from_ and x['from'] <= to_, sessions))
    
    for sess in sessions:
        for k,v in sess['data'].items():
            if interests.get(k) == None:
                interests[k] = {'keywords': {i : 1 for i in v}}
            else:
                for key in v:
                    if interests[k]['keywords'].get(key) == None:
                        interests[k]['keywords'][key] = 1
                    else:
                        interests[k]['keywords'][key] += 1
        
        if interests[list(sess['data'].keys())[0]].get('urls') == None:
            interests[list(sess['data'].keys())[0]]['urls'] = [sess['url']]
        else:
            interests[list(sess['data'].keys())[0]]['urls'].append(sess['url'])
                        
    return interests


