import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=(ROOT/'assets'/'app-core.js').read_text()+(ROOT/'assets'/'app-runtime.js').read_text()
DOMAINS=['attention','reasoning','decision','flexibility','pressure']

def test_100_unique_scenarios_in_both_languages():
    all_ids=[]
    for domain in DOMAINS:
        text=(ROOT/'assets'/f'{domain}.js').read_text()
        ids=re.findall(r'"id":"(RL3-[A-Z]+-\d\d)"',text)
        assert len(ids)==20
        assert text.count('"fr":{')==20
        assert text.count('"en":{')==20
        all_ids+=ids
    assert len(set(all_ids))==100

def test_offline_bundle_complete():
    sw=(ROOT/'sw.js').read_text()
    for path in ['index.html','manifest.webmanifest','icon.svg','assets/style.css','assets/app-core.js','assets/app-runtime.js']+[f'assets/{d}.js' for d in DOMAINS]:
        assert (ROOT/path).is_file()
        assert f"'./{path}'" in sw or (path=='index.html' and "'./index.html'" in sw)

def test_no_cloud_speech_or_tracking():
    assert 'processLocally=true' in SRC and 'Factory.available' in SRC
    assert 'processLocally=false' not in SRC
    assert 'https://' not in SRC and 'http://' not in SRC
    assert 'MediaRecorder' in SRC and 'getUserMedia' in SRC
    assert 'fetch(' not in SRC

def test_local_storage_is_separate_from_v2():
    assert "response-lab-v3-state-v1" in SRC
    assert 'response-lab-state-v1' not in SRC

def test_objective_scoring_and_time_limited_pressure():
    assert 'Math.round' in SRC
    assert 'answerChoice' in SRC and 'calcQuality' in SRC
    assert 'adaptPressure' in SRC and 'cognitiveTarget' in SRC and 'oralTarget' in SRC
    assert "stressBefore" in SRC and 'stressAfter' in SRC

def test_import_validation():
    assert 'response-lab-scenario-pack-v1' in SRC
    assert 'validateScenario' in SRC
    assert '1_500_000' in SRC
    assert 'existing' in SRC

def test_branching_and_regulation():
    assert 's.answers.decision?.chosen===0' in SRC
    assert 'startBreath()' in SRC
    assert 'session.clips[phase]' in SRC and 'saveAudioClip' in SRC

def test_home_separate_from_original():
    assert 'TRAINING / 3.1' in (ROOT/'index.html').read_text()
    assert (ROOT/'GUIDE_DEMARRAGE.md').is_file()
