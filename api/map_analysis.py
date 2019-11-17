from pymongo import MongoClient
from itertools import groupby
from operator import itemgetter
from datetime import timedelta, datetime
import matplotlib.pyplot as plt
import os
import mimetypes
import base64
from textblob import TextBlob
from statistics import mean

bad_habbits = [ "Unethical",  "Drug Abuse",
        "Hacking", "Illegal or Unethical", "Discrimination",
        "Explicit Violence",  "Extremist Groups",  "Child Abuse",
        "Adult/Mature Content", "Gambling", "Nudity and Risque",  "Pornography",
        "Weapons (Sales)",  "Marijuana",  "Alcohol",  "Tobacco"]

def get_bad_habbits(frames, from_ = None, to_ = None):
    print('STARTED HABBITS')
    sessions = to_sessions(frames, type_='unclassified')
    
    if from_ != None and to_ != None:
        sessions = list(filter(lambda x: x['from'] >= from_ and x['from'] <= to_, sessions))
    
    keys = [list(i['data'].keys())[0] for i in sessions]

    stats = {}

    for i in bad_habbits:
        stats[i] = keys.count(i) / len(keys)

    print(stats)
    print('FINISHED HABITS')
    return stats

def to_sessions(frames, type_= None):
    if type_ != None:
        frames = list(filter(lambda x: x['type'] == type_, frames))
    
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
            'disorder_score': max([i['disorder_score'] for i in sample])
        }
        
        data = []
        for i in sample:
            data.extend(list(i['data'].values())[0])
        
        temp['data'] = {list(sample[0]['data'].keys())[0]: data}
        
        sessions.append(temp)
    return sessions


def get_basic_stats(sessions, from_= None, to_= None):
    print('GETTING BASE STATS')
    interests = {}

    sessions = list(filter(lambda x: x['type'] == 'unclassified', sessions))

    if from_ != None and to_ != None:
        sessions = list(filter(lambda x: x['from'] >= from_ and x['from'] <= to_, sessions))
    
    for sess in sessions:
        session_time = datetime.strptime(sess['to'].split('.')[0], '%Y-%m-%dT%H:%M:%S') - datetime.strptime(sess['from'].split('.')[0], '%Y-%m-%dT%H:%M:%S')

        for k,v in sess['data'].items():
            if interests.get(k) == None:
                interests[k] = {'keywords': {i : session_time.seconds for i in v}}
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


def compile_charts(stats):
    print('COMPILING CHARTS')

    # del stats['unclassified']

    charts = {}
    l1_chart = ([], [])

    all_points = sum([sum(list(i['keywords'].values())) for i in stats.values()])

    for key,value in stats.items():
        total_points = sum(list(value['keywords'].values()))
        
        if total_points / all_points > 0.03:
            l1_chart[0].append(key)
            l1_chart[1].append(total_points)
        
        if total_points == 0:
            continue
        
        plt.figure()
        plt.pie([float(v) for v in value['keywords'].values() if v / total_points >= 0.03], labels=[k for k in value['keywords'].keys() if value['keywords'][k] / total_points >= 0.03],
                   autopct=None)

        plt.draw()

        plt.savefig('temp.png', format='png')

        mime, _ = mimetypes.guess_type('temp.png')
        with open("temp.png", "rb") as image_file:
            data64 = base64.b64encode(image_file.read())
        uri = u'data:%s;base64,%s' % (mime, data64.decode())
        charts[key] = '<hr><img src="%s" width=80%% height=80%%<hr>' % uri

    print(l1_chart)
    plt.figure()
    plt.pie(l1_chart[1], labels= l1_chart[0], autopct=None)
    plt.draw()

    plt.savefig('temp.png', format='png')

    mime, _ = mimetypes.guess_type('temp.png')
    with open("temp.png", "rb") as image_file:
        data64 = base64.b64encode(image_file.read())
    
    uri = u'data:%s;base64,%s' % (mime, data64.decode())
    charts['Main Chart'] = '<hr><img src="%s" width=80%% height=80%%><hr>' % uri

    return charts

def sentiment_stats(frames, from_ = None, to_ = None):
    messages = list(filter(lambda x: x['type'] == 'sn_message', frames))

    if from_ != None and to_ != None:
        messages = list(filter(lambda x: x['timestamp'] >= from_ and x['timestamp'] <= to_, messages))
    
    
    posts = list(filter(lambda x: x['type'] == 'sn_feed', frames))
    if from_ != None and to_ != None:
        posts = list(filter(lambda x: x['timestamp'] >= from_ and x['timestamp'] <= to_, posts))
    
    msg_stats = {}
    for i in messages:
        msg_stats[i['timestamp']] = TextBlob(i['data']).polarity
    
    post_stats = {}
    for i in posts:
        post_stats[i['timestamp']] = TextBlob(i['data']).polarity
    
    print('COMPLETED SENTIMENT STATS')
    return {'Messages': msg_stats, 'Posts': post_stats}

def compile_sentiment_charts(stats, seconds):
    #split
    charts = {}

    for cat in stats:
        intervals = []

        start_time = datetime.strptime(min(list(stats[cat].keys())).split('.')[0], '%Y-%m-%dT%H:%M:%S')
        end_time = datetime.strptime(max(list(stats[cat].keys())).split('.')[0], '%Y-%m-%dT%H:%M:%S')

        for i in range((end_time - start_time).seconds // seconds):
            intervals.append(start_time + timedelta(seconds=seconds*(i+1)))
        
        smooth = {}

        for i,v in enumerate(intervals):
            if i == 0:
                selection = list(filter(lambda x: x[0] <= str(v).replace(' ', 'T'), list(stats[cat].items())))
            else:
                selection = list(filter(lambda x: x[0] <= str(v).replace(' ', 'T') and x[0] >= str(intervals[i-1]).replace(' ', 'T'), list(stats[cat].items())))

            try:
                smooth[str(v)] = mean([i[1] for i in selection])
            except:
                smooth[str(v)] = 0
        
        plt.figure()
        plt.xticks([])
        plt.plot(list(smooth.keys()), list(smooth.values()))
        plt.draw()

        plt.savefig('temp.png', format='png')

        mime, _ = mimetypes.guess_type('temp.png')
        with open("temp.png", "rb") as image_file:
            data64 = base64.b64encode(image_file.read())
        
        uri = u'data:%s;base64,%s' % (mime, data64.decode())
        charts[cat] = '<hr><img src="%s" width=80%% height=80%%><hr>' % uri
    

    all_data = list(stats['Messages'].values()) + list(stats['Posts'].values())
    
    plt.figure()
    plt.pie([sum(list(filter(lambda x: x <= 0, all_data))), sum(list(filter(lambda x: x >= 0, all_data)))], labels= ['Negative', 'Positive'], autopct=None)
    plt.draw()

    plt.savefig('temp.png', format='png')
    mime, _ = mimetypes.guess_type('temp.png')
    with open("temp.png", "rb") as image_file:
        data64 = base64.b64encode(image_file.read())
    
    uri = u'data:%s;base64,%s' % (mime, data64.decode())
    charts['Pie'] = '<hr><img src="%s" width=80%% height=80%%><hr>' % uri

    return charts

def inclusion_analysis(frames, from_= None, to_= None ):
    print('STARTED INCLUSION')
    frames = to_sessions(list(filter(lambda x: x['type'] == 'unclassified' or x['type'] == 'search', frames)))

    if from_ != None and to_ != None:
        frames = list(filter(lambda x: x['timestamp'] >= from_ and x['timestamp'] <= to_, frames))

    total_score = sum([i['disorder_score'] for i in frames if 'disorder_score' in i.keys()])
    scores = {}
    
    for i in frames:
        if i['disorder_score'] == 1 or i['disorder_score'] == 0:
            continue
        if scores.get(list(i['data'].keys())[0]) == None:
            scores[list(i['data'].keys())[0]] = 2 ** i['disorder_score']
        else:
            scores[list(i['data'].keys())[0]] += 2 ** i['disorder_score']

    scores.update({'total': total_score})
    print(scores)
    print('FINISHED INCLUSIONS')
    return scores

#day check
def check_triggers(frames, from_ = None, to_ = None):
    stats = {}
    #ABSOLUTE DISORDER SCORE TRIGGERS.
    stats['disorder'] = inclusion_analysis(frames)
    #SENTIMENT TRIGGERS
    stats['sentiment'] = sentiment_stats(frames)
    #BAD HABBIT TRIGGERS
    stats['habbits'] = get_bad_habbits(frames)

    # Levels: NO, LOW, MED, HIGH
    # {'level': x, 'sources': [y], 'value': z}

    # Disorder (per day): LOW (50 - 200) // MED (200-500) // HIGH (500+)
    # Disorder (per week): LOW (350 - 1400) // MED (1400-3500) // HIGH (3500+) 

    # Sentiment (per day / week): LOW (0.3-0.5) // MED (0.5-0.8) // HIGH (0.8+)
    
    # Bad habbits (per day / week): LOW (0.05 - 0.10) // MED (0.10 - 0.20) // HIGH (0.20+)
    
    triggers = {}
    # disorder_score
    if stats['disorder']['total'] >= 50 and stats['disorder']['total'] < 200:
        trigger_sources = sorted(list(stats['disorder'].items()), key=lambda x: x[1], reverse=True)[1][0]
        triggers['Disorder Score'] = {'level': 'LOW', 'sources': [trigger_sources], 'value': stats['disorder']['total']}
    elif stats['disorder']['total'] >= 200 and stats['disorder']['total'] < 500:
        trigger_sources = [i[0] for i in sorted(list(stats['disorder'].items()), key=lambda x: x[1], reverse=True)[1:4]]
        triggers['Disorder Score'] = {'level': 'MED', 'sources': trigger_sources, 'value': stats['disorder']['total']}
    elif stats['disorder']['total'] >= 500:
        trigger_sources = [i[0] for i in sorted(list(stats['disorder'].items()), key=lambda x: x[1], reverse=True)[1:6]]
        triggers['Disorder Score'] = {'level': 'HIGH', 'sources': trigger_sources, 'value': stats['disorder']['total']}
    else:
        triggers['Disorder Score'] = {'level': 'NO', 'sources': [], 'value': stats['disorder']['total']}
    
    #sentiment
    all_data = list(stats['sentiment']['Messages'].values()) + list(stats['sentiment']['Posts'].values())
    
    negative = sum(list(filter(lambda x: x <= 0, all_data))) / sum(all_data)

    if negative >= 0.3 and negative < 0.5:
        triggers['Content Mood'] = {'level': 'LOW', 'sources': [], 'value': negative}
    elif negative >= 0.5 and stats['disorder']['total'] < 0.8:
        triggers['Content Mood'] = {'level': 'MED', 'sources': [], 'value': negative}
    elif negative >= 0.8:
        triggers['Content Mood'] = {'level': 'HIGH', 'sources': [], 'value': negative}
    else:
        triggers['Content Mood'] = {'level': 'NO', 'sources': [], 'value': negative}
    
    #bad habbits
    total = sum(list(stats['habbits'].values()))

    if total >= 0.05 and total < 0.1:
        trigger_sources = sorted(list(stats['habbits'].items()), key=lambda x: x[1], reverse=True)[1][0]
        triggers['Questionable habbits'] = {'level': 'LOW', 'sources': [trigger_sources], 'value': total}
    elif total >= 0.1 and total < 0.2:
        trigger_sources = sorted(list(stats['habbits'].items()), key=lambda x: x[1], reverse=True)[1:4][0]
        triggers['Questionable habbits'] = {'level': 'MED', 'sources': [trigger_sources], 'value': total}
    elif total >= 0.2:
        trigger_sources = [i[0] for i in sorted(list(stats['habbits'].items()), key=lambda x: x[1], reverse=True)[1:6]]
        triggers['Questionable habbits'] = {'level': 'HIGH', 'sources': [trigger_sources], 'value': total}
    else:
        triggers['Questionable habbits'] = {'level': 'NO', 'sources': [], 'value': total}
    
    return triggers

recommendations = {
    'Disorder Score': {
        'NO': 'You are in a great mental condition. Keep up!',
        'LOW': 'How are you feeling today? A little more rest would not hurt :)',
        'MED': 'Feeling down today? Here is a thing to help you out: *link_to_test*',
        'HIGH': 'Soap n roap, huh?'
    },

    'Content Mood': {
        'NO': 'Healthy dose of negative rhanting in social nets acquired!',
        'LOW': 'Avoiding angry or upsetting content in social media will make the day even brighter!',
        'MED': 'I suppose, it is enough of social nets for today. Have a good rest.',
        'HIGH': 'You have surrounded you with negative content. Red alert, son'
    },

    'Questionable habbits': {
        'NO': 'You have an amazingly healthy digital environment!',
        'LOW': 'You spent so much time on the web today. Why are you interested in the following topics?',
        'MED': 'It is time to start keeping track of the following things. Reducing the browsing of them will be good for you :)',
        'HIGH': 'Be careful, really. We will miss you so much if something goes wrong :('
    }
}

def compile_recommendations(stats):
    html = ''
    for i in stats:

        in_ = (
            i, stats[i]['value'], recommendations[i][stats[i]['level']], ''.join(['<li>%s</li>' % src for src in stats[i]['sources']])
        )
        
        html += '<h3><strong>%s</strong></h3><hr><div class="alert alert-info" role="alert"><p style="text-align:center"><strong>Score: %s</strong></p></div><p>%s</p><ul>%s</ul>' % in_
        print(html)
    return html