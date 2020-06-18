#!/usr/bin/python
# -*- coding: utf-8 -*-
"""
This code demonstrates how to use RecordLink with two comma separated
values (CSV) files. We have listings of products from two different
online stores. The task is to link products between the datasets.

The output will be a CSV with our linkded results.

"""
import os
import csv
import re
import logging
import optparse

import dedupe
from unidecode import unidecode
from datetime import datetime


def preProcess(column):
    """
    Do a little bit of data cleaning with the help of Unidecode and Regex.
    Things like casing, extra spaces, quotes and new lines can be ignored.
    """

    column = unidecode(column)
    column = re.sub('\n', ' ', column)
    column = re.sub('-', '', column)
    column = re.sub('/', ' ', column)
    column = re.sub("'", '', column)
    column = re.sub(",", '', column)
    column = re.sub(":", ' ', column)
    column = re.sub('  +', ' ', column)
    column = column.strip().strip('"').strip("'").lower().strip()
    if not column:
        column = None
    return column


def readData(filename):
    """
    Read in our data from a CSV file and create a dictionary of records,
    where the key is a unique record ID.
    """

    data_d = {}

    with open(filename) as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            clean_row = dict([(k, preProcess(v)) for (k, v) in row.items()])
            data_d[filename + str(i)] = dict(clean_row)

    return data_d

def printComment(comment):
    """
    Prepend a timestamp to the printed comment
    """

    print(datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + ': ' + comment)

if __name__ == '__main__':

    # ## Logging

    # dedupe uses Python logging to show or suppress verbose output. Added for convenience.
    # To enable verbose logging, run `python examples/csv_example/csv_example.py -v`
    optp = optparse.OptionParser()
    optp.add_option('-v', '--verbose', dest='verbose', action='count',
                    help='Increase verbosity (specify multiple times for more)'
                    )
    (opts, args) = optp.parse_args()
    log_level = logging.WARNING
    if opts.verbose:
        if opts.verbose == 1:
            log_level = logging.INFO
        elif opts.verbose >= 2:
            log_level = logging.DEBUG
    logging.getLogger().setLevel(log_level)

    # ## Setup

    output_file = 'data-output/data_matching_output.csv'
    settings_file = 'data-training/data_matching_learned_settings'
    training_file = 'data-training/data_matching_training.json'

    left_file = 'data-input/FoxWBYProviderWithID_10k.csv'
    right_file = 'data-input/FoxCHSProviderWithID_10k.csv'

    printComment('Importing first data file...')
    data_1 = readData(left_file)

    printComment('Importing second data file...')
    data_2 = readData(right_file)

    printComment('Finished data import')

    # ## Training

    if os.path.exists(settings_file):
        print('reading from', settings_file)
        with open(settings_file, 'rb') as sf:
            linker = dedupe.StaticRecordLink(sf)

    else:
        # Define the fields the linker will pay attention to
        fields = [
            {'field': 'FullName', 'type': 'Name'},
            {'field': 'EMAIL', 'type': 'String','has missing': True},
            {'field': 'ADDRESS_1__C', 'type': 'String','has missing': True},
            {'field': 'ADDRESS_2__C', 'type': 'String','has missing': True},
            {'field': 'CITY__C', 'type': 'ShortString','has missing': True},
            {'field': 'STATE__C', 'type': 'ShortString','has missing': True},
            {'field': 'ZIPCODE__C', 'type': 'ShortString','has missing': True},
            {'field': 'PHONE', 'type': 'String','has missing': True},
            {'field': 'NPI_NUMBER__C', 'type': 'ShortString','has missing': True}]

        # Create a new linker object and pass our data model to it.
        linker = dedupe.RecordLink(fields)

        # If we have training data saved from a previous run of linker,
        # look for it an load it in.
        # __Note:__ if you want to train from scratch, delete the training_file
        if os.path.exists(training_file):
            print('reading labeled examples from ', training_file)
            with open(training_file) as tf:
                linker.prepare_training(data_1,
                                        data_2,
                                        training_file=tf,
                                        sample_size=15000)
        else:
            printComment('Prepare training')
            linker.prepare_training(data_1, data_2, sample_size=15000)

        # ## Active learning
        # Dedupe will find the next pair of records
        # it is least certain about and ask you to label them as matches
        # or not.
        # use 'y', 'n' and 'u' keys to flag duplicates
        # press 'f' when you are finished
        printComment('starting active labeling...')

        dedupe.console_label(linker)

        linker.train()

        # When finished, save our training away to disk
        with open(training_file, 'w') as tf:
            linker.write_training(tf)

        # Save our weights and predicates to disk.  If the settings file
        # exists, we will skip all the training and learning next time we run
        # this file.
        with open(settings_file, 'wb') as sf:
            linker.write_settings(sf)

    # ## Blocking

    # ## Clustering

    # Find the threshold that will maximize a weighted average of our
    # precision and recall.  When we set the recall weight to 2, we are
    # saying we care twice as much about recall as we do precision.
    #
    # If we had more data, we would not pass in all the blocked data into
    # this function but a representative sample.

    printComment('clustering...')
    linked_records = linker.join(data_1, data_2, 0.0)

    print(datetime.now().strftime("%m/%d/%Y, %H:%M:%S"), ': # duplicate sets', len(linked_records))
    # ## Writing Results

    # Write our original data back out to a CSV with a new column called
    # 'Cluster ID' which indicates which records refer to each other.

    cluster_membership = {}
    for cluster_id, (cluster, score) in enumerate(linked_records):
        for record_id in cluster:
            cluster_membership[record_id] = {'Cluster ID': cluster_id,
                                             'Link Score': score}

    with open(output_file, 'w') as f:

        header_unwritten = True

        for fileno, filename in enumerate((left_file, right_file)):
            with open(filename) as f_input:
                reader = csv.DictReader(f_input)

                if header_unwritten:

                    fieldnames = (['Cluster ID', 'Link Score', 'source file'] +
                                  reader.fieldnames)

                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()

                    header_unwritten = False

                for row_id, row in enumerate(reader):

                    record_id = filename + str(row_id)
                    cluster_details = cluster_membership.get(record_id, {})
                    row['source file'] = fileno
                    row.update(cluster_details)

                    writer.writerow(row)
